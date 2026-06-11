import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  fileUrl: string;           // Cloudinary URL
  rawMarkdown: string;       // Cleaned text from PDF parser
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  rawMarkdown: { type: String, required: true },
}, { timestamps: true });

ResumeSchema.index({ userId: 1, createdAt: -1 });

export const Resume = mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
