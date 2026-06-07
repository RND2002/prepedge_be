import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = 'noreply@prepedge.online';

export const sendPasswordResetEmail = async (email: string, otp: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `PrepEdge <${fromEmail}>`,
      to: [email],
      subject: 'PrepEdge Password Reset Code',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
          <h2 style="color: #F0A500; text-align: center; font-size: 24px; font-weight: 700;">PrepEdge Password Reset</h2>
          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.5; text-align: center;">You requested a password reset. Please use the following 6-digit code to reset your password.</p>
          <div style="background-color: #1A1A1A; border: 1px solid #333333; border-radius: 8px; padding: 20px 10px; text-align: center; margin: 30px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #F0A500; white-space: nowrap; display: inline-block;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #A0A0A0; text-align: center; margin-top: 20px;">This code will expire in 15 minutes.</p>
          <p style="font-size: 14px; color: #666666; text-align: center; margin-top: 40px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending reset email:', error);
    } else {
      console.log('Password reset email sent:', data);
    }
  } catch (error) {
    console.error('Failed to send reset email:', error);
  }
};

export const sendOTPVerificationEmail = async (email: string, otp: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `PrepEdge <${fromEmail}>`,
      to: [email],
      subject: 'Your PrepEdge Verification Code',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="color: #F0A500; font-size: 40px; font-weight: bold;">[ ]</span>
            <h1 style="color: #F0A500; font-size: 28px; margin-top: 10px; margin-bottom: 0;">Prepedge</h1>
          </div>
          <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 600; text-align: center; margin-bottom: 20px;">Verify Your Email</h2>
          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.5; text-align: center;">Welcome to PrepEdge! To complete your registration and secure your account, please use the following verification code.</p>
          
          <div style="background-color: #1A1A1A; border: 1px solid #333333; border-radius: 8px; padding: 20px 10px; text-align: center; margin: 30px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #F0A500; white-space: nowrap; display: inline-block;">${otp}</span>
          </div>

          <p style="font-size: 14px; color: #A0A0A0; text-align: center; margin-top: 20px;">This code will expire in 15 minutes.</p>
          <p style="font-size: 12px; color: #666666; text-align: center; margin-top: 40px; border-top: 1px solid #1A1A1A; padding-top: 20px;">If you didn't attempt to register an account, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending OTP email:', error);
    } else {
      console.log('OTP email sent:', data);
    }
  } catch (error) {
    console.error('Failed to send OTP email:', error);
  }
};
