export interface IUser {
  _id?: string;
  githubId: string;
  username: string;
  email: string;
  avatarUrl: string;
  githubAccessToken?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IResume {
  _id?: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  rawMarkdown: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type InsightStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ISuggestedBulletPoint {
  original: string;
  improved: string;
  reason: string;
}

export interface IGithubAuditRepo {
  repoName: string;
  language: string;
  stars: number;
  findings: string[];
}

export interface IInsightAnalysis {
  matchRate: number;
  missingKeywords: string[];
  foundKeywords: string[];
  suggestedBulletPoints: ISuggestedBulletPoint[];
  githubAudit?: IGithubAuditRepo[];
  portfolioCritique?: string;
  overallSummary: string;
}

export interface IInsight {
  _id?: string;
  userId: string;
  resumeId: string;
  targetJobTitle: string;
  targetJobDescription?: string;
  includeGithub: boolean;
  status: InsightStatus;
  progress: number;
  currentStage: string;
  executionLogs: string[];
  analysis?: IInsightAnalysis;
  errorDetails?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface GeminiAnalysisResult {
  matchRate: number;
  foundKeywords: string[];
  missingKeywords: string[];
  suggestedBulletPoints: ISuggestedBulletPoint[];
  githubAudit: IGithubAuditRepo[];
  portfolioCritique: string;
  overallSummary: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface JobProgressData {
  status: InsightStatus;
  progress: number;
  currentStage: string;
  logs: string[];
  error?: string;
}

export interface GitHubRepoSummary {
  repoName: string;
  language: string;
  stars: number;
  description: string;
  readme: string;
}
