import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRefreshToken extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
  userId: { type: String, index: true, required: true },
  token: { type: String, unique: true, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  createdAt: { type: Date, default: Date.now },
});

export const RefreshToken: Model<IRefreshToken> = mongoose.models.RefreshToken || mongoose.model<IRefreshToken>("RefreshToken", RefreshTokenSchema);
