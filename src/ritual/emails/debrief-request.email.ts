import { DebriefRequestEmailProps } from './types';
import { sendRitualEmail } from './mailer';

export const sendDebriefRequestEmail = async (to: string, props: DebriefRequestEmailProps) => {
  const subject = `How did it go?`;

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
      <p style="font-size: 16px; color: #E0E0E0;">Hey ${props.firstName},</p>
      
      <p style="font-size: 16px; color: #E0E0E0; margin-top: 24px;">
        Yesterday was ${props.company}.
      </p>
      
      <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 16px;">
        We want to know how it went — not just for us,<br />
        but because reflecting right now while it's fresh<br />
        is the single most powerful thing you can do<br />
        whether you cleared it or not.
      </p>

      <p style="font-size: 16px; color: #E0E0E0; margin-top: 24px; font-weight: 600;">
        How did the interview go?
      </p>

      <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 12px; max-width: 250px;">
        <a href="https://prepedge.online/ritual/debrief?outcome=cleared" style="display: block; background-color: #1A1A1A; color: #4ADE80; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 15px; border: 1px solid #22432C; text-align: center;">
          It went well →
        </a>
        <a href="https://prepedge.online/ritual/debrief?outcome=mixed" style="display: block; background-color: #1A1A1A; color: #FBBF24; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 15px; border: 1px solid #453310; text-align: center;">
          Mixed feelings →
        </a>
        <a href="https://prepedge.online/ritual/debrief?outcome=tough" style="display: block; background-color: #1A1A1A; color: #F87171; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 15px; border: 1px solid #451F1F; text-align: center;">
          It was tough →
        </a>
      </div>

      <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 32px;">
        Whatever happened — you showed up.<br />
        That matters more than the outcome.
      </p>

      <p style="font-size: 16px; color: #E0E0E0; margin-top: 24px;">
        <strong>Prepedge</strong>
      </p>
    </div>
  `;

  return sendRitualEmail(to, subject, html);
};
