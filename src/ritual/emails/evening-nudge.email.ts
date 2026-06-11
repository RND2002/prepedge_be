import { EveningNudgeEmailProps } from './types';
import { sendRitualEmail } from './mailer';

export const sendEveningNudgeEmail = async (to: string, props: EveningNudgeEmailProps) => {
  const subject = `Still with you, ${props.firstName}.`;

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
      <p style="font-size: 16px; color: #E0E0E0;">Hey ${props.firstName},</p>
      
      <p style="font-size: 16px; color: #A0A0A0; margin-top: 24px;">
        Day ${props.dayNumber} isn't done yet.
      </p>
      
      <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 16px;">
        15 minutes is enough. Even one topic.<br />
        The ritual is the consistency, not the perfection.
      </p>

      <div style="margin-top: 32px;">
        <a href="https://prepedge.online/ritual" style="display: inline-block; background-color: #333333; color: #E0E0E0; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 16px; border: 1px solid #4D4D4D;">
          Pick up where you left off →
        </a>
      </div>

      <p style="font-size: 16px; color: #E0E0E0; margin-top: 40px;">
        <strong>Prepedge</strong>
      </p>
    </div>
  `;

  return sendRitualEmail(to, subject, html);
};
