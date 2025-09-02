import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComment {
  userId: string;
  text: string;
  date: Date;
}
export interface IPost {
  postId: string;
  contentType: "image" | "reel" | "text";
  contentUrl: string;
  caption: string;
  likes: number;
  comments: IComment[];
  createdAt: Date;
}
export interface IHighlight { highlightId: string; contentUrl: string; title: string }
export interface IAchievement { badgeId: string; badgeName: string; iconUrl: string }
export interface IConnection { friendId: string; username: string; profilePic: string }

export interface IProfile extends Document {
  userId: string; // can be User _id or username fallback
  username: string;
  handle: string;
  title: string;
  bio: string;
  profilePic: string;
  linkedStars: number;
  starlit: number;
  posts: IPost[];
  highlights: IHighlight[];
  achievements: IAchievement[];
  connections: IConnection[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  userId: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, required: true },
}, { _id: false });

const PostSchema = new Schema<IPost>({
  postId: { type: String, required: true },
  contentType: { type: String, enum: ["image","reel","text"], required: true },
  contentUrl: { type: String, default: "" },
  caption: { type: String, default: "" },
  likes: { type: Number, default: 0 },
  comments: { type: [CommentSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const HighlightSchema = new Schema<IHighlight>({
  highlightId: { type: String, required: true },
  contentUrl: { type: String, default: "" },
  title: { type: String, default: "" },
}, { _id: false });

const AchievementSchema = new Schema<IAchievement>({
  badgeId: { type: String, required: true },
  badgeName: { type: String, required: true },
  iconUrl: { type: String, default: "" },
}, { _id: false });

const ConnectionSchema = new Schema<IConnection>({
  friendId: { type: String, required: true },
  username: { type: String, required: true },
  profilePic: { type: String, default: "" },
}, { _id: false });

const ProfileSchema = new Schema<IProfile>({
  userId: { type: String, index: true, unique: true },
  username: { type: String, index: true },
  handle: { type: String, default: "" },
  title: { type: String, default: "" },
  bio: { type: String, default: "" },
  profilePic: { type: String, default: "" },
  linkedStars: { type: Number, default: 0 },
  starlit: { type: Number, default: 0 },
  posts: { type: [PostSchema], default: [] },
  highlights: { type: [HighlightSchema], default: [] },
  achievements: { type: [AchievementSchema], default: [] },
  connections: { type: [ConnectionSchema], default: [] },
}, { timestamps: true });

export const Profile: Model<IProfile> = mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);
