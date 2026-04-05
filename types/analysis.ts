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

export interface AnalysisReport {
  id: string;
  title: string;
  description: string;
  file_content: string;
  similarity_score: number;
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
