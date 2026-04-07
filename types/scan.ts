export type ScanStatus = 'pending' | 'running' | 'done' | 'error';
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'pass';
export type IssueCategory = 'performance' | 'seo' | 'security' | 'mobile' | 'ai_visibility';

export interface Issue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  plainEnglish: string;
  cursorPrompt: string;
  boltPrompt: string;
  docsUrl?: string;
  value?: string | number;
}

export interface CategoryScore {
  score: number;
  label: 'excellent' | 'good' | 'needs-work' | 'poor';
  issues: Issue[];
  passedChecks: number;
  totalChecks: number;
}

export interface ScanResult {
  url: string;
  scannedAt: string;
  totalScore: number;
  performance: CategoryScore;
  seo: CategoryScore;
  security: CategoryScore;
  mobile: CategoryScore;
  ai_visibility: CategoryScore;
  aiSummary?: string;
  aiTechnicalPrompt?: string;
  aiVibePrompt?: string;
  issuePrompts?: Record<string, { technical: string; vibe: string }>;
}

export interface Scan {
  id: string;
  url: string;
  status: ScanStatus;
  results: ScanResult | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}
