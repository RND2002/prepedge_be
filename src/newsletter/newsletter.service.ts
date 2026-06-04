import { Newsletter } from './newsletter.schema';
import { ErrorCodes } from '../lib/errors';

export class NewsletterService {
  static async signup(email: string, ipAddress: string) {
    // Check duplicate
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      throw new Error(ErrorCodes.DUPLICATE_EMAIL);
    }

    // Save document
    const newSignup = new Newsletter({
      email,
      ipAddress
    });

    await newSignup.save();
    return newSignup;
  }
}
