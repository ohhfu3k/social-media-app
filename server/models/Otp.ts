import mongoose, { Schema } from "mongoose";

export interface IOtp {
  _id: mongoose.Types.ObjectId;
  channel: "email" | "phone";
  identifier: string; // normalized email or phone digits
  code: string; // 6 digits
  expiresAt: Date;
  used: boolean;
  purpose?: "signup" | "reset";
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  channel: { type: String, enum: ["email", "phone"], required: true },
  identifier: { type: String, required: true, index: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  used: { type: Boolean, default: false },
  purpose: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
