import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Admin, AdminRefreshToken } from '../src/admin/admin.model';

const ADMIN_ACCESS_SECRET = process.env.ADMIN_ACCESS_SECRET || 'admin_fallback_access_secret';
const ACCESS_EXPIRES_IN = '15m';

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected.');

  // Find the latest token
  const storedToken = await AdminRefreshToken.findOne({}).sort({ createdAt: -1 });
  if (!storedToken) {
    console.log('No token found');
    return;
  }

  console.log('Stored token:', storedToken);

  try {
    console.log('Finding admin...');
    const admin = await Admin.findById(storedToken.adminId);
    console.log('Admin:', admin);

    if (!admin || !admin.isActive) {
      console.log('Admin not found or inactive');
      return;
    }

    console.log('Signing JWT...');
    const payload = { sub: admin._id, email: admin.email, role: admin.role };
    const accessToken = jwt.sign(payload, ADMIN_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
    console.log('Access token signed successfully:', accessToken);
  } catch (error) {
    console.error('ERROR ENCOUNTERED:', error);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
