import { GameDayEmailProps } from './types';
import { sendRitualEmail } from './mailer';

export const sendGameDayEmail = async (to: string, props: GameDayEmailProps) => {
  const subject = `Today.`;

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
      <p style="font-size: 16px; color: #E0E0E0;">Hey ${props.firstName},</p>
      
      <p style="font-size: 18px; color: #F0A500; font-weight: 600; margin-top: 24px;">
        Today is ${props.company}.
      </p>
      
      <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 16px;">
        You put in the work. You know what they want to hear.<br />
        Now go show them.
      </p>

      <p style="font-size: 16px; color: #A0A0A0; margin-top: 24px;">
        The whole Prepedge community is rooting for you.
      </p>

      <p style="font-size: 16px; color: #E0E0E0; margin-top: 24px;">
        <strong>Prepedge</strong>
      </p>
    </div>
  `;

  return sendRitualEmail(to, subject, html);
};
