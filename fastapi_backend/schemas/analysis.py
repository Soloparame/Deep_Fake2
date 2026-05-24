from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class SWOTBlock(BaseModel):
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)
    threats: List[str] = Field(default_factory=list)


class TechComparisonRow(BaseModel):
    area: str = ""
    user_stack: str = ""
    competitor_stack: str = ""
    advantage: str = ""


class ReferenceItem(BaseModel):
    title: str
    url: str
    kind: Literal["github", "arxiv"] = "github"


class StrategyVenn(BaseModel):
    shared_features: List[str] = Field(default_factory=list)
    unique_to_you: List[str] = Field(default_factory=list)
    unique_to_market: List[str] = Field(default_factory=list)


class StrategyBlock(BaseModel):
    venn: StrategyVenn = Field(default_factory=StrategyVenn)
    market_pivots: List[str] = Field(default_factory=list)
    monetization: List[str] = Field(default_factory=list)


class SimilarProjectItem(BaseModel):
    name: str = ""
    link: str = ""
    snippet: str = ""


class SimilarDocumentItem(BaseModel):
    id: str = ""
    title: str = ""
    url: str = ""
    snippet: str = ""
    document_type: str = "web"
    source: str = ""
    paper_id: str = ""
    s2_url: str = Field(default="", description="Semantic Scholar paper page URL")
    year: Optional[int] = None
    venue: str = ""
    is_open_access: bool = False
    citation_count: int = 0
    similarity_percent: Optional[float] = Field(
        default=None,
        description="Overall semantic similarity to the upload (Bahir Dar corpus)",
    )


class DocumentMatchItem(BaseModel):
    user_start: int = 0
    user_end: int = 0
    matched_text: str = ""
    source_document_id: str = ""
    source_url: str = ""
    source_title: str = ""
    similarity: float = Field(ge=0, le=100, default=0)
    source_excerpt: str = ""
    source_type: str = Field(default="", description="database | online | publication")


class PlagiarismSummaryItem(BaseModel):
    db_matches: int = 0
    web_matches: int = 0
    pub_matches: int = 0
    total_plagiarism_percent: float = 0.0


class HighlightSegmentItem(BaseModel):
    segment: str = ""
    is_plagiarized: bool = False
    start_index: int = 0
    end_index: int = 0
    source_id: str = ""
    source_title: str = ""
    source_type: str = ""
    similarity: float = 0.0
    color: str = ""


class PlagiarismSourceItem(BaseModel):
    type: str = ""
    id: str = ""
    title: str = ""
    link: str = ""
    similarity_percent: float = 0.0


class CompetitorMapEntry(BaseModel):
    name: str = ""
    description: str = ""
    url: str = ""
    price_score: float = Field(ge=0, le=100, default=50)
    quality_score: float = Field(ge=0, le=100, default=50)
    local_support_score: float = Field(ge=0, le=100, default=50)
    market_share_score: float = Field(ge=0, le=100, default=50)
    color: str = "#64748b"
    is_you: bool = False
    tag: Literal["Competitor", "Global player"] = "Competitor"


class AnalysisReport(BaseModel):
    id: str
    title: str
    description: str
    file_content: str
    similarity_score: float = Field(ge=0, le=100, description="Percentage 0–100")
    similarity_label: Optional[str] = Field(
        default=None,
        description="UI badge, e.g. similar vs distinct",
    )
    similarity_description: Optional[str] = Field(
        default=None,
        description="How the overlap index was computed",
    )
    market_search_snippet: Optional[str] = Field(
        default=None,
        description="Web/market text compared against your document (truncated)",
    )
    found_projects: List[SimilarProjectItem] = Field(
        default_factory=list,
        description="Named competitors/projects extracted from web search results",
    )
    similar_documents: List[SimilarDocumentItem] = Field(
        default_factory=list,
        description="Similar PDFs/papers (Semantic Scholar + web PDF search)",
    )
    document_matches: List[DocumentMatchItem] = Field(
        default_factory=list,
        description="Passage-level overlaps between user text and similar documents",
    )
    plagiarism_summary: Optional[PlagiarismSummaryItem] = Field(
        default=None,
        description="2 DB + 2 web + 2 publication source counts and total flagged %",
    )
    highlighted_segments: List[HighlightSegmentItem] = Field(
        default_factory=list,
        description="Original document split into plain and plagiarized segments",
    )
    plagiarism_sources: List[PlagiarismSourceItem] = Field(
        default_factory=list,
        description="Exactly six sources when available: 2 database, 2 online, 2 publication",
    )
    company_name: str = Field(
        default="",
        description="Display name for the user's company on positioning map (usually same as title)",
    )
    competitor_map: List[CompetitorMapEntry] = Field(
        default_factory=list,
        description="Points for competitive scatter chart (user + extracted competitors)",
    )
    similarity_hf_live: Optional[bool] = Field(
        default=None,
        description="True if score came from Hugging Face Inference API",
    )
    swot: SWOTBlock = Field(default_factory=SWOTBlock)
    tech_comparison: List[TechComparisonRow] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    references: List[ReferenceItem] = Field(default_factory=list)
    strategy: StrategyBlock = Field(default_factory=StrategyBlock)
    devils_advocate: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None


class AnalysisListItem(BaseModel):
    id: str
    title: str
    similarity_score: float
    created_at: Optional[datetime] = None


class AnalysisHistoryResponse(BaseModel):
    analyses: List[AnalysisListItem]
