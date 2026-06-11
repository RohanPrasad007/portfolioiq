import mongoose, { Schema, Document } from 'mongoose';
import { InsightStatus } from '@portfolioiq/shared';

export interface IInsight extends Document {
  userId: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  targetJobTitle: string;
  targetJobDescription?: string;
  includeGithub: boolean;
  status: InsightStatus;
  progress: number;          // 0-100
  currentStage: string;
  executionLogs: string[];
  analysis?: {
    matchRate: number;        // 0-100
    missingKeywords: string[];
    foundKeywords: string[];
    suggestedBulletPoints: Array<{ original: string; improved: string; reason: string }>;
    githubAudit?: Array<{
      repoName: string;
      language: string;
      stars: number;
      findings: string[];
    }>;
    portfolioCritique?: string;
    overallSummary: string;
  };
  errorDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InsightSchema = new Schema<IInsight>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
  targetJobTitle: { type: String, required: true },
  targetJobDescription: { type: String, default: '' },
  includeGithub: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  currentStage: { type: String, default: 'Queued' },
  executionLogs: [{ type: String }],
  analysis: {
    matchRate: Number,
    missingKeywords: [String],
    foundKeywords: [String],
    suggestedBulletPoints: [{
      original: String,
      improved: String,
      reason: String,
    }],
    githubAudit: [{
      repoName: String,
      language: String,
      stars: Number,
      findings: [String],
    }],
    portfolioCritique: String,
    overallSummary: String,
  },
  errorDetails: { type: String, default: null },
}, { timestamps: true });

InsightSchema.index({ userId: 1, status: 1 });
InsightSchema.index({ resumeId: 1 });

export const Insight = mongoose.models.Insight || mongoose.model<IInsight>('Insight', InsightSchema);
