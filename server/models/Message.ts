import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  convoId: string;
  participants: string[]; // userIds or usernames
  authorId: string; // sender id (userId or username)
  text: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  convoId: { type: String, index: true, required: true },
  participants: { type: [String], index: true, default: [] },
  authorId: { type: String, index: true, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
