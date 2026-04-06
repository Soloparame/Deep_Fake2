from __future__ import annotations

import asyncio
import datetime
from typing import Optional, Tuple

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status

from fastapi_backend.database import analyses_col, new_id
from fastapi_backend.services.auth_service import AuthService
from fastapi_backend.services.similarity_search import SimilarityResult, compute_similarity_overlap
from fastapi_backend.schemas.analysis import (
    AnalysisHistoryResponse,
    AnalysisListItem,
    AnalysisReport,
    ReferenceItem,
    StrategyBlock,
    StrategyVenn,
    SWOTBlock,
    TechComparisonRow,
)
from fastapi_backend.utils.document_text import extract_text_from_upload, merge_content_snippet

router = APIRouter()


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
    my_tech_hint: str,
    sim: SimilarityResult,
) -> AnalysisReport:
    user_stack = (my_tech_hint or "Next.js, TypeScript, Tailwind").strip()
    return AnalysisReport(
        id=analysis_id,
        title=title or "Untitled project",
        description=description,
        file_content=file_content[:8000] + ("..." if len(file_content) > 8000 else ""),
        similarity_score=sim.score,
        similarity_label=sim.label,
        similarity_description=sim.description,
        market_search_snippet=sim.market_snippet,
        similarity_hf_live=sim.hf_ok,
        swot=SWOTBlock(
            strengths=[
                "Clear problem statement and defined user persona",
                "Modern stack aligns with hiring market expectations",
                "Room to differentiate on workflow UX",
            ],
            weaknesses=[
                "Overlap with several well-funded competitors",
                "Limited moat if features remain generic",
            ],
            opportunities=[
                "Niche vertical packaging (e.g. education, compliance)",
                "Partnerships with existing data providers",
            ],
            threats=[
                "Rapid LLM commoditization of baseline features",
                "Platform risk if relying on a single vendor API",
            ],
        ),
        tech_comparison=[
            TechComparisonRow(
                area="Auth & data",
                user_stack=user_stack,
                competitor_stack="Firebase Auth, Firestore, proprietary rules",
                advantage="Your choice keeps logic portable and avoids vendor lock-in for auth flows you control end-to-end.",
            ),
            TechComparisonRow(
                area="Search / vectors",
                user_stack="Embeddings API + managed vector DB (e.g. Pinecone)",
                competitor_stack="Elasticsearch + custom ranking",
                advantage="Faster iteration for semantic search prototypes; easier to tune per domain without ops-heavy clusters.",
            ),
            TechComparisonRow(
                area="Payments",
                user_stack="Stripe",
                competitor_stack="PayPal + manual invoicing",
                advantage="Stripe’s developer UX and webhooks reduce time-to-first-revenue for SaaS billing.",
            ),
        ],
        recommendations=[
            "Supabase for Postgres + auth + realtime if you want fewer moving parts early",
            "Pinecone or Qdrant Cloud for vector search with minimal ops",
            "Stripe Billing for subscription monetization",
            "OpenTelemetry + a hosted collector for observability before scale",
        ],
        references=[
            ReferenceItem(
                title="Similarity & citation tooling (examples)",
                url="https://github.com/topics/plagiarism-detection",
                kind="github",
            ),
            ReferenceItem(
                title="Sentence-BERT: Sentence Embeddings (arXiv)",
                url="https://arxiv.org/abs/1908.10084",
                kind="arxiv",
            ),
            ReferenceItem(
                title="Dense passage retrieval for open-domain QA (arXiv)",
                url="https://arxiv.org/abs/2004.04906",
                kind="arxiv",
            ),
        ],
        strategy=StrategyBlock(
            venn=StrategyVenn(
                shared_features=[
                    "Document upload & similarity score",
                    "User dashboard for history",
                    "API-first integration story",
                ],
                unique_to_you=[
                    "Devil’s advocate defense prep",
                    "Combined SWOT + tech lens in one report",
                    "Strategy tab with pivot ideas tailored to your abstract",
                ],
                unique_to_market=[
                    "Mature enterprise SSO & audit trails",
                    "Large pre-indexed web corpus licensing",
                ],
            ),
            market_pivots=[
                "Position as “thesis defense copilot” for graduate programs",
                "Sell to bootcamps as an originality + structure coach",
                "White-label API for LMS vendors",
            ],
            monetization=[
                "SaaS: tiered monthly plans by pages analyzed",
                "Freemium: free limited scans; paid deep reports & exports",
                "B2B site license for institutions",
            ],
        ),
        devils_advocate=[
            "If similarity is high, what evidence proves original contribution beyond paraphrasing?",
            "Why would users pay recurringly instead of using a free LLM once?",
            "What stops an incumbent from shipping your roadmap in one sprint?",
            "Which metric will you defend in six months if growth stalls?",
        ],
        created_at=datetime.datetime.utcnow(),
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
    returns structured analysis (SWOT/strategy still template) and persists to MongoDB.
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

    file_content = merge_content_snippet(title, description, extracted)
    if not file_content.strip():
        file_content = "(No document body — title and description only.)"

    analysis_id = new_id()
    sim = await asyncio.to_thread(
        compute_similarity_overlap,
        title,
        description.strip(),
        file_content,
    )
    report = _build_report(
        analysis_id=analysis_id,
        title=title,
        description=description.strip(),
        file_content=file_content,
        my_tech_hint=my_tech_stack,
        sim=sim,
    )

    record = report.model_dump()
    record["_id"] = analysis_id
    record["created_at"] = datetime.datetime.utcnow()
    record["input"] = {
        "title": title,
        "description": description,
        "my_tech_stack": my_tech_stack,
        "had_file": bool(file and file.filename),
    }
    record["user_id"] = user_id
    record["user_email"] = user_email

    try:
        analyses_col.insert_one(record)
    except Exception as e:
        print(f"analyze: Mongo insert failed: {e}")

    return report


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
    try:
        return AnalysisReport(**doc)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Invalid stored record: {e}",
        )
