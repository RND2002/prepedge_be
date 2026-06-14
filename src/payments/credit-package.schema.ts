import mongoose, { Schema, Document } from 'mongoose';

export interface ICreditPackage extends Document {
  packageId: string;
  name: string;
  displayName?: string;
  credits: number;
  priceInPaise: number;
  pricePerCredit: number;
  discountPercent: number;
  tagline?: string;
  taglineCollege?: string;
  taglinePro?: string;
  taglineDefault?: string;
  features: string[];
  unlocks: string[];
  doesNotInclude: string[];
  sortOrder: number;
  priceDisplay?: string;
  isHighlighted: boolean;
  isActive: boolean;
}

const CreditPackageSchema = new Schema(
  {
    packageId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    displayName: { type: String },
    credits: { type: Number, required: true },
    priceInPaise: { type: Number, required: true },
    pricePerCredit: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    tagline: { type: String },
    taglineCollege: { type: String, default: '' },
    taglinePro: { type: String, default: '' },
    taglineDefault: { type: String },
    features: { type: [String], required: true },
    unlocks: { type: [String], default: [] },
    doesNotInclude: { type: [String], default: [] },
    sortOrder: { type: Number, default: 0 },
    priceDisplay: { type: String },
    isHighlighted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CreditPackage = mongoose.model<ICreditPackage>('CreditPackage', CreditPackageSchema);
