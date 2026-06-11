import { DayBeforeEmailProps } from './types';
import { sendRitualEmail } from './mailer';

export const sendDayBeforeEmail = async (to: string, props: DayBeforeEmailProps) => {
  const subject = `Tomorrow is the day.`;

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
      <p style="font-size: 16px; color: #E0E0E0;">Hey ${props.firstName},</p>
      
      <p style="font-size: 16px; color: #F0A500; font-weight: 600; margin-top: 24px;">
        Tomorrow is ${props.company}.
      </p>
      
      <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 16px;">
        You've done ${props.daysCompleted} days of focused work.<br />
        You know your weak spots and you've worked on them.<br />
        You know how ${props.company} thinks and what they want to hear.
      </p>

      <p style="font-size: 16px; color: #E0E0E0; margin-top: 24px;">Tonight — no more prep.</p>

      <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 16px;">
        Eat well. Sleep early.<br />
        Trust what you've built this week.
      </p>

      <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 24px;">
        The version of you that walks in tomorrow<br />
        is not the same one who started this Ritual.
      </p>

      <p style="font-size: 16px; color: #A0A0A0; margin-top: 24px;">
        We'll be with you in the morning.
      </p>

      <p style="font-size: 16px; color: #E0E0E0; margin-top: 24px;">
        <strong>Prepedge</strong>
      </p>
    </div>
  `;

  return sendRitualEmail(to, subject, html);
};
