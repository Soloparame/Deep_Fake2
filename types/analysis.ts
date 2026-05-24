export interface SwotBlock {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface TechComparisonRow {
  area: string;
  user_stack: string;
  competitor_stack: string;
  advantage: string;
}

export interface ReferenceItem {
  title: string;
  url: string;
  kind: "github" | "arxiv";
}

export interface StrategyVenn {
  shared_features: string[];
  unique_to_you: string[];
  unique_to_market: string[];
}

export interface StrategyBlock {
  venn: StrategyVenn;
  market_pivots: string[];
  monetization: string[];
}

export interface SimilarProjectItem {
  name: string;
  link: string;
  snippet: string;
}

export interface SimilarDocumentItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  document_type: string;
  source: string;
  paper_id?: string;
  s2_url?: string;
  year?: number | null;
  venue?: string;
  is_open_access?: boolean;
  citation_count?: number;
  /** Overall similarity to your upload (Bahir Dar corpus) */
  similarity_percent?: number | null;
}

export interface DocumentMatchItem {
  user_start: number;
  user_end: number;
  matched_text: string;
  source_document_id: string;
  source_url: string;
  source_title: string;
  similarity: number;
  source_excerpt?: string;
  source_type?: string;
}

export interface PlagiarismSummaryItem {
  db_matches: number;
  web_matches: number;
  pub_matches: number;
  total_plagiarism_percent: number;
}

export interface HighlightSegmentItem {
  segment: string;
  is_plagiarized: boolean;
  start_index: number;
  end_index: number;
  source_id?: string;
  source_title?: string;
  source_type?: string;
  similarity?: number;
  color?: string;
}

export interface PlagiarismSourceItem {
  type: string;
  id: string;
  title: string;
  link: string;
  similarity_percent: number;
}

export type CompetitorMapTag = "Competitor" | "Global player";

export interface CompetitorMapEntry {
  name: string;
  description: string;
  url: string;
  price_score: number;
  quality_score: number;
  local_support_score: number;
  market_share_score: number;
  color: string;
  is_you: boolean;
  tag: CompetitorMapTag;
}

export interface AnalysisReport {
  id: string;
  title: string;
  description: string;
  file_content: string;
  similarity_score: number;
  /** Badge for the gauge, e.g. "similar" | "distinct" */
  similarity_label?: string | null;
  /** How the overlap score was produced (HF + web vs fallback) */
  similarity_description?: string | null;
  /** Snippet of web/synthetic "market" text used for comparison */
  market_search_snippet?: string | null;
  /** Extracted real-world projects/competitors from market search text */
  found_projects: SimilarProjectItem[];
  similar_documents?: SimilarDocumentItem[];
  document_matches?: DocumentMatchItem[];
  plagiarism_summary?: PlagiarismSummaryItem | null;
  highlighted_segments?: HighlightSegmentItem[];
  plagiarism_sources?: PlagiarismSourceItem[];
  /** User-facing name for positioning map (usually same as title) */
  company_name?: string;
  /** Scatter chart: you + competitors with synthetic axis scores */
  competitor_map?: CompetitorMapEntry[];
  /** True when the score came from Hugging Face Inference */
  similarity_hf_live?: boolean | null;
  swot: SwotBlock;
  tech_comparison: TechComparisonRow[];
  recommendations: string[];
  references: ReferenceItem[];
  strategy: StrategyBlock;
  devils_advocate: string[];
  created_at?: string | null;
}

export interface AnalysisListItem {
  id: string;
  title: string;
  similarity_score: number;
  created_at?: string | null;
}
