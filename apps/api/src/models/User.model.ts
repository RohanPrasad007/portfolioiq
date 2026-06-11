import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  githubId: string;
  username: string;
  email: string;
  avatarUrl: string;
  githubAccessToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  avatarUrl: { type: String, required: true },
  githubAccessToken: { type: String, default: null },
}, { timestamps: true });

UserSchema.index({ email: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
