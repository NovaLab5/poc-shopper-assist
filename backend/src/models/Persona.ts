import mongoose, { Schema, Document } from 'mongoose';

export interface IPersona extends Document {
  type: string; // mother, father, friend, etc.
  name: string;
  age: number;
  gender: string;
  interests: string[];
  lastPurchase?: {
    item: string;
    occasion: string;
    date: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PersonaSchema: Schema = new Schema(
  {
    type: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 120,
    },
    gender: {
      type: String,
      required: true,
      lowercase: true,
      enum: ['male', 'female', 'other'],
    },
    interests: {
      type: [String],
      default: [],
    },
    lastPurchase: {
      item: String,
      occasion: String,
      date: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups by type
PersonaSchema.index({ type: 1 });

export default mongoose.model<IPersona>('Persona', PersonaSchema);

