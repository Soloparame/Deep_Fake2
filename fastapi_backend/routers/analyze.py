from __future__ import annotations

import asyncio
import datetime
from typing import Optional, Tuple

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import Response

from fastapi_backend.database import analyses_col, new_id
from fastapi_backend.services.auth_service import AuthService
from fastapi_backend.services.similarity_search import SimilarityResult, compute_similarity_overlap
from fastapi_backend.services.swot_service import generate_swot_analysis
from fastapi_backend.services.tech_lens_service import generate_tech_lens
from fastapi_backend.services.recommendations_service import generate_recommendations_and_resources
from fastapi_backend.services.devils_advocate_service import generate_devils_advocate_questions
from fastapi_backend.services.positioning_service import generate_market_positioning
from fastapi_backend.schemas.analysis import (
    AnalysisHistoryResponse,
    AnalysisListItem,
    AnalysisReport,
    DocumentMatchItem,
    HighlightSegmentItem,
    PlagiarismSourceItem,
    PlagiarismSummaryItem,
    ReferenceItem,
    SimilarDocumentItem,
    SimilarProjectItem,
    StrategyBlock,
    SWOTBlock,
    TechComparisonRow,
)
from fastapi_backend.utils.document_text import (
    extract_document_body,
    extract_text_from_upload,
    merge_content_snippet,
    strip_extraction_banner,
)
from fastapi_backend.services import project_intel_docx, project_intel_ppt
from fastapi_backend.services.competitor_map_service import build_competitor_map
from fastapi_backend.services.document_similarity_service import (
    DocumentSimilarityResult,
    compute_document_similarity,
)

router = APIRouter()

DOC_SIM_TIMEOUT_SEC = 120.0


async def _run_document_similarity(title: str, description: str, document_body: str) -> DocumentSimilarityResult:
    body = (document_body or "").strip()
    if body.startswith("(No document body"):
        body = f"{title}\n{description}".strip()

    try:
        return await asyncio.wait_for(
            asyncio.to_thread(
                compute_document_similarity,
                title,
                description,
                body,
            ),
            timeout=DOC_SIM_TIMEOUT_SEC,
        )
    except asyncio.TimeoutError:
        print(f"analyze: document similarity timed out after {DOC_SIM_TIMEOUT_SEC}s — using database-only fallback")
        from fastapi_backend.services.plagiarism_engine import run_plagiarism_check_db_only, to_document_similarity_result

        try:
            engine = await asyncio.to_thread(run_plagiarism_check_db_only, title, description, body)
            result = to_document_similarity_result(engine)
            result.analysis_note = (
                "Web/publication search timed out; showing Bahir Dar database matches. "
                "Retry with a shorter file for full online results."
            )
            return result
        except Exception as e:
            print(f"analyze: db-only fallback failed: {e}")
            return DocumentSimilarityResult(
                analysis_note="Document similarity timed out. Check MongoDB connection and try again.",
            )


def _user_from_request(request: Request) -> Tuple[Optional[str], Optional[str]]:
    """Returns (user_id, email) from Bearer token, or (None, None) if missing/invalid."""
    token = request.headers.get("Authorization")
    if not token:
        return None, None
    try:
        profile = AuthService.get_current_user_profile(token)
        return profile.get("id"), profile.get("email")
    except Exception:
        return None, None


def _build_report(
    analysis_id: str,
    title: str,
    description: str,
    file_content: str,
    sim: SimilarityResult,
    doc_sim: DocumentSimilarityResult,
    swot: SWOTBlock,
    tech_comparison: list[TechComparisonRow],
    recommendations: list[str],
    references: list[ReferenceItem],
    devils_advocate: list[str],
    strategy: StrategyBlock,
    had_file: bool = False,
) -> AnalysisReport:
    display_title = (title or "Untitled project").strip() or "Untitled project"
    found_list = [
        SimilarProjectItem(name=p.name, link=p.link, snippet=p.snippet) for p in sim.found_projects
    ]
    similar_docs = [
        SimilarDocumentItem(
            id=d.id,
            title=d.title,
            url=d.url,
            snippet=d.snippet,
            document_type=d.document_type,
            source=d.source,
            paper_id=d.paper_id,
            s2_url=d.s2_url,
            year=d.year,
            venue=d.venue,
            is_open_access=d.is_open_access,
            citation_count=d.citation_count,
            similarity_percent=d.similarity_percent,
        )
        for d in doc_sim.similar_documents
    ]
    doc_matches = [
        DocumentMatchItem(
            user_start=m.user_start,
            user_end=m.user_end,
            matched_text=m.matched_text,
            source_document_id=m.source_document_id,
            source_url=m.source_url,
            source_title=m.source_title,
            similarity=m.similarity,
            source_excerpt=m.source_excerpt,
            source_type=getattr(m, "source_type", "") or "",
        )
        for m in doc_sim.document_matches
    ]
    plag_summary = None
    if doc_sim.plagiarism_summary:
        plag_summary = PlagiarismSummaryItem(**doc_sim.plagiarism_summary)
    highlight_segs = [
        HighlightSegmentItem(**h) for h in (doc_sim.highlighted_segments or [])
    ]
    plag_sources = [
        PlagiarismSourceItem(**s) for s in (doc_sim.sources_list or [])
    ]
    content_cap = 30_000
    stored_content = file_content[:content_cap] + ("..." if len(file_content) > content_cap else "")
    return AnalysisReport(
        id=analysis_id,
        title=display_title,
        description=description,
        file_content=stored_content,
        similarity_score=sim.score,
        similarity_label=sim.label,
        similarity_description=sim.description,
        market_search_snippet=sim.market_snippet,
        found_projects=found_list,
        similar_documents=similar_docs,
        document_matches=doc_matches,
        plagiarism_summary=plag_summary,
        highlighted_segments=highlight_segs,
        plagiarism_sources=plag_sources,
        company_name=display_title,
        competitor_map=build_competitor_map(display_title, description.strip(), found_list),
        similarity_hf_live=sim.hf_ok,
        swot=swot,
        tech_comparison=tech_comparison,
        recommendations=recommendations,
        references=references,
        strategy=strategy,
        devils_advocate=devils_advocate,
        created_at=datetime.datetime.utcnow(),
        had_file=had_file,
    )


@router.post("/analyze", response_model=AnalysisReport)
async def analyze_project(
    request: Request,
    title: str = Form(...),
    description: str = Form(""),
    my_tech_stack: str = Form(""),
    pasted_content: str = Form(""),
    file: Optional[UploadFile] = File(None),
):
    """
    Accept multipart form: title, description, optional my_tech_stack, optional pasted_content,
    optional PDF/DOCX file. Extracts text, runs web search + HF similarity for the overlap index,
    returns structured analysis (SWOT via Groq + remaining sections template) and persists to MongoDB.
    Requires Authorization so the run is stored under your user (same as other app features).
    """
    user_id, user_email = _user_from_request(request)
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to run analyses and save them to your account.",
        )

    title = (title or "").strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required.")

    extracted = ""
    if file and file.filename:
        raw = await file.read()
        if len(raw) > 25 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File too large (max 25 MB).",
            )
        try:
            extracted, _kind = extract_text_from_upload(file.filename, raw)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception as e:
            # PyMuPDF / python-docx errors, corrupt PDFs, missing deps — return clear 400, not 500
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not read this file: {e}",
            )

    pasted = (pasted_content or "").strip()
    if not extracted and pasted:
        extracted = pasted

    document_body = extract_document_body(extracted, pasted, description.strip())
    if not document_body.strip() or document_body.startswith("(No document body"):
        document_body = (extracted or pasted or description or title).strip()
    if not document_body.strip():
        document_body = "(No document body — add a file, paste text, or use the description field.)"

    # Plagiarism uses clean extracted text (not the placeholder message)
    plagiarism_input = strip_extraction_banner(extracted or pasted or document_body)

    # Market overlap index uses title + description + body; highlights/SWOT use body only.
    market_context = merge_content_snippet(title, description.strip(), extracted or pasted)

    analysis_id = new_id()
    desc = description.strip()
    had_file = bool(file and file.filename)

    if had_file:
        sim, doc_sim = await asyncio.gather(
            asyncio.to_thread(compute_similarity_overlap, title, desc, market_context),
            _run_document_similarity(title, desc, plagiarism_input),
        )
    else:
        sim = await asyncio.to_thread(compute_similarity_overlap, title, desc, market_context)
        doc_sim = DocumentSimilarityResult()

    if doc_sim.analysis_note:
        document_body = f"ℹ️ {doc_sim.analysis_note}\n\n{document_body}"

    swot = await asyncio.to_thread(
        generate_swot_analysis,
        title,
        desc,
        document_body,
        sim.score,
        sim.market_snippet,
        my_tech_stack,
    )

    tech_lens, devils_advocate, strategy = await asyncio.gather(
        asyncio.to_thread(
            generate_tech_lens,
            title,
            desc,
            my_tech_stack,
            sim.market_snippet,
        ),
        asyncio.to_thread(
            generate_devils_advocate_questions,
            title,
            desc,
            sim.score,
            sim.market_snippet,
        ),
        asyncio.to_thread(
            generate_market_positioning,
            title,
            desc,
            sim.score,
            sim.market_snippet,
            swot.weaknesses,
            my_tech_stack,
        ),
    )
    recommendations, references = await asyncio.to_thread(
        generate_recommendations_and_resources,
        title,
        desc,
        sim.score,
        swot,
        sim.market_snippet,
    )

    report = _build_report(
        analysis_id=analysis_id,
        title=title,
        description=desc,
        file_content=document_body,
        sim=sim,
        doc_sim=doc_sim,
        swot=swot,
        tech_comparison=tech_lens,
        recommendations=recommendations,
        references=references,
        devils_advocate=devils_advocate,
        strategy=strategy,
        had_file=had_file,
    )

    record = report.model_dump()
    record["_id"] = analysis_id
    record["created_at"] = datetime.datetime.utcnow()
    record["input"] = {
        "title": title,
        "description": description,
        "my_tech_stack": my_tech_stack,
        "had_file": had_file,
    }
    record["user_id"] = user_id
    record["user_email"] = user_email

    try:
        analyses_col.insert_one(record)
    except Exception as e:
        print(f"analyze: Mongo insert failed: {e}")

    return report


@router.post("/analyses/export-ppt")
async def export_analysis_ppt(request: Request, report: AnalysisReport):
    """
    Build a .pptx from the same JSON shape as AnalysisReport (Project Intel modal).
    Requires sign-in; body is the report payload (compatible with JSON export from the UI).
    """
    _, user_email = _user_from_request(request)
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to export this report as PowerPoint.",
        )
    try:
        data, fname = await asyncio.to_thread(project_intel_ppt.build_ppt_bytes, report)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PPT generation failed: {e}",
        ) from e
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


@router.post("/analyses/export-docx")
async def export_analysis_docx(request: Request, report: AnalysisReport):
    """
    Build a .docx from the same JSON shape as AnalysisReport (Project Intel modal).
    Requires sign-in; body is the report payload (compatible with JSON export from the UI).
    """
    _, user_email = _user_from_request(request)
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to export this report as Word.",
        )
    try:
        data, fname = await asyncio.to_thread(project_intel_docx.build_docx_bytes, report)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Word export failed: {e}",
        ) from e
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


@router.get("/analyses", response_model=AnalysisHistoryResponse)
async def list_analyses(request: Request, limit: int = 30):
    """Recent analyses for the signed-in user (newest first)."""
    _, user_email = _user_from_request(request)
    if not user_email:
        return AnalysisHistoryResponse(analyses=[])

    items: list[AnalysisListItem] = []
    try:
        cursor = (
            analyses_col.find({"user_email": user_email})
            .sort("created_at", -1)
            .limit(min(max(limit, 1), 100))
        )
        for doc in cursor:
            aid = doc.get("_id") or doc.get("id")
            if aid is None:
                continue
            items.append(
                AnalysisListItem(
                    id=str(aid),
                    title=doc.get("title", "Untitled"),
                    similarity_score=float(doc.get("similarity_score", 0)),
                    created_at=doc.get("created_at"),
                )
            )
    except Exception as e:
        print(f"list_analyses: {e}")
    return AnalysisHistoryResponse(analyses=items)


@router.get("/analyses/{analysis_id}", response_model=AnalysisReport)
async def get_analysis(request: Request, analysis_id: str):
    _, user_email = _user_from_request(request)
    if not user_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in to view this analysis.")

    doc = analyses_col.find_one({"_id": analysis_id})
    if not doc:
        doc = analyses_col.find_one({"id": analysis_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

    owner = doc.get("user_email")
    if owner and owner != user_email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this analysis.")

    doc.pop("_id", None)
    if "id" not in doc and analysis_id:
        doc["id"] = analysis_id
    if "had_file" not in doc:
        inp = doc.get("input")
        doc["had_file"] = bool(inp.get("had_file")) if isinstance(inp, dict) else False
    try:
        report = AnalysisReport(**doc)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Invalid stored record: {e}",
        )
    cn = (report.company_name or report.title or "").strip() or "Untitled project"
    rivals_on_map = sum(1 for e in (report.competitor_map or []) if not e.is_you)
    rivals_expected = len(report.found_projects or [])
    if rivals_on_map < rivals_expected or not report.competitor_map:
        report = report.model_copy(
            update={
                "company_name": cn,
                "competitor_map": build_competitor_map(cn, report.description or "", list(report.found_projects)),
            }
        )
    return report


@router.delete("/analyses/{analysis_id}")
async def delete_analysis(request: Request, analysis_id: str):
    """
    Delete one analysis owned by the signed-in user.
    """
    _, user_email = _user_from_request(request)
    if not user_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in required.")

    try:
        result = analyses_col.delete_one({"_id": analysis_id, "user_email": user_email})
        if result.deleted_count == 0:
            # Backward compatibility for records keyed with "id" field
            result = analyses_col.delete_one({"id": analysis_id, "user_email": user_email})
        if result.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")
        return {"ok": True, "id": analysis_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delete failed: {e}",
        )
