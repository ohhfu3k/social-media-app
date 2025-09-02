import mongoose, { Schema } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string; // display_name
  email?: string;
  phone?: string;
  passwordHash?: string;
  avatar?: string; // profile_image_url
  username?: string;
  bio?: string;
  entranceStyle?: string;
  linkedStars?: number;
  starlit?: number;
  location?: string;
  timezone?: string;
  gender?: string;
  pronouns?: string;
  theme?: string;
  isPrivate?: boolean;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, index: true, unique: true, sparse: true },
  phone: { type: String, index: true, unique: true, sparse: true },
  passwordHash: { type: String },
  avatar: { type: String },
  username: { type: String, index: true, unique: true, sparse: true },
  bio: { type: String },
  entranceStyle: { type: String },
  linkedStars: { type: Number, default: 0 },
  starlit: { type: Number, default: 0 },
  location: { type: String },
  timezone: { type: String },
  gender: { type: String },
  pronouns: { type: String },
  theme: { type: String },
  isPrivate: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
