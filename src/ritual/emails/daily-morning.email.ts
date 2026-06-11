import { DailyMorningEmailProps } from './types';
import { sendRitualEmail } from './mailer';

export const sendDailyMorningEmail = async (to: string, props: DailyMorningEmailProps) => {
  const subject = `Day ${props.dayNumber} — ${props.focusTopic}`;

  const subtopicsHtml = props.subTopics
    .map((topic) => `<li>→ ${topic}</li>`)
    .join('\n        ');

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
      <p style="font-size: 16px; color: #E0E0E0;">Hey ${props.firstName},</p>
      
      <p style="font-size: 16px; color: #A0A0A0; margin-top: 24px;">Day ${props.dayNumber} of ${props.totalDays}.</p>
      
      <p style="font-size: 18px; color: #F0A500; font-weight: 600; margin-top: 24px;">
        Today: ${props.focusTopic}
      </p>

      <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 16px;">
        ${props.whyItMattersText}
      </p>

      <p style="font-size: 16px; color: #E0E0E0; margin-top: 24px;">Your focus for today:</p>
      <ul style="list-style-type: none; padding: 0; margin-top: 12px; color: #A0A0A0; line-height: 1.8;">
        ${subtopicsHtml}
      </ul>

      <p style="font-size: 14px; color: #666666; margin-top: 24px;">
        Estimated time: ${props.estimatedMinutes} minutes.
      </p>

      <div style="margin-top: 32px;">
        <a href="https://prepedge.online/ritual" style="display: inline-block; background-color: #F0A500; color: #0D0D0D; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Start Today's Session →
        </a>
      </div>

      <p style="font-size: 16px; color: #A0A0A0; margin-top: 40px;">
        ${props.company} is ${props.daysLeft} days away.<br />
        You're getting sharper.
      </p>

      <p style="font-size: 16px; color: #E0E0E0; margin-top: 24px;">
        <strong>Prepedge</strong>
      </p>
    </div>
  `;

  return sendRitualEmail(to, subject, html);
};
