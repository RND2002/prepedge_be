import { CompanyFocusEmailProps } from './types';
import { sendRitualEmail } from './mailer';

export const sendCompanyFocusEmail = async (to: string, props: CompanyFocusEmailProps) => {
  const subject = `Tomorrow, we talk about ${props.company}.`;

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
      <p style="font-size: 16px; color: #E0E0E0;">Hey ${props.firstName},</p>
      
      <p style="font-size: 16px; color: #E0E0E0; margin-top: 24px;">Today is different.</p>
      
      <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 16px;">
        Everything we cover today is specific to <span style="color: #F0A500; font-weight: 600;">${props.company}</span>.<br />
        How they interview. What they actually want to hear.<br />
        What most candidates get wrong.
      </p>

      <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 24px;">
        ${props.company} doesn't just want someone who knows the answer.<br />
        They want someone who thinks like ${props.companyTier} engineers do.
      </p>

      <p style="font-size: 16px; color: #E0E0E0; margin-top: 32px;">Here's what we know about their process:</p>
      <ul style="list-style-type: none; padding: 0; margin-top: 12px; color: #A0A0A0; line-height: 1.8;">
        <li>→ <strong style="color: #E0E0E0;">${props.round1}:</strong> ${props.round1Focus}</li>
        <li>→ <strong style="color: #E0E0E0;">${props.round2}:</strong> ${props.round2Focus}</li>
      </ul>

      <div style="background-color: #1A1A1A; padding: 20px; border-radius: 8px; border: 1px solid #333333; margin-top: 24px;">
        <p style="font-size: 14px; color: #A0A0A0; margin: 0;">
          <strong style="color: #E0E0E0;">What they really want to hear:</strong><br />
          ${props.whatTheyReallyWantToHear}
        </p>
        <p style="font-size: 14px; color: #A0A0A0; margin-top: 16px; margin-bottom: 0;">
          <strong style="color: #E0E0E0;">Common mistake candidates make:</strong><br />
          ${props.commonMistakes}
        </p>
      </div>

      <div style="margin-top: 32px;">
        <a href="https://prepedge.online/ritual" style="display: inline-block; background-color: #F0A500; color: #0D0D0D; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Start ${props.company} Focus Session →
        </a>
      </div>

      <p style="font-size: 16px; color: #A0A0A0; margin-top: 40px;">
        Tomorrow is warmup. Today is the work.
      </p>

      <p style="font-size: 16px; color: #E0E0E0; margin-top: 24px;">
        <strong>Prepedge</strong>
      </p>
    </div>
  `;

  return sendRitualEmail(to, subject, html);
};
