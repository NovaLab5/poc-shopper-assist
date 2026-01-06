import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  id: string;
  name: string;
  brand: string;
  category: string;
  tags: string[];
  price: number;
  amazonUrl: string;
  imageUrl?: string;
  rating?: number;
  store?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    amazonUrl: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.5,
    },
    store: {
      type: String,
      default: 'Amazon',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ name: 'text', brand: 'text' });

export default mongoose.model<IProduct>('Product', ProductSchema);

