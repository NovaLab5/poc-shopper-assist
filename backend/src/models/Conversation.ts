import mongoose, { Schema, Document } from 'mongoose';

/**
 * Message interface
 */
export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  showProducts?: boolean;
  productCategory?: string;
}

/**
 * Conversation interface
 */
export interface IConversation extends Document {
  userId: string;
  userName?: string;
  messages: IMessage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message schema
 */
const MessageSchema = new Schema<IMessage>({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  showProducts: {
    type: Boolean,
    default: false,
  },
  productCategory: {
    type: String,
    required: false,
  },
});

/**
 * Conversation schema
 */
const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: false,
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
ConversationSchema.index({ userId: 1, createdAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

