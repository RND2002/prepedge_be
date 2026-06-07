import mongoose, { Schema, Document } from 'mongoose';

export interface IAmbassador extends Document {
  fullName: string;
  email: string;
  phone: string;
  collegeName: string;
  city: string;
  state: string;
  branch: 'CSE' | 'IT' | 'ECE' | 'EEE' | 'Mechanical' | 'Other';
  graduationYear: number;
  currentYear: '3rd Year' | '4th Year';
  whyAmbassador: string;
  communitiesCanReach: string;
  linkedinUrl?: string;
  referralCode?: string;
  referralCount: number;
  activeReferrals: number;
  status: 'applied' | 'approved' | 'rejected' | 'inactive';
  userId?: mongoose.Types.ObjectId;
  appliedAt: Date;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AmbassadorSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    collegeName: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    branch: { 
      type: String, 
      required: true,
      enum: ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Other']
    },
    graduationYear: { 
      type: Number, 
      required: true,
      enum: [2025, 2026, 2027]
    },
    currentYear: { 
      type: String, 
      required: true,
      enum: ['3rd Year', '4th Year']
    },
    whyAmbassador: { 
      type: String, 
      required: true,
      minlength: 50,
      maxlength: 500
    },
    communitiesCanReach: { 
      type: String, 
      required: true,
      minlength: 30,
      maxlength: 300
    },
    linkedinUrl: { type: String },
    
    referralCode: { type: String, unique: true, sparse: true },
    referralCount: { type: Number, default: 0 },
    activeReferrals: { type: Number, default: 0 },
    
    status: { 
      type: String, 
      enum: ['applied', 'approved', 'rejected', 'inactive'],
      default: 'applied'
    },
    
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    
    appliedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null }
  },
  { timestamps: true }
);

AmbassadorSchema.index({ status: 1 });
AmbassadorSchema.index({ collegeName: 1 });

export const Ambassador = mongoose.model<IAmbassador>('Ambassador', AmbassadorSchema);
