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
