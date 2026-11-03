// Отправка писем через Brevo. Два способа, оба только по ключам из .env:
// HTTP API (BREVO_API_KEY, xkeysib-…) или SMTP-релей (SMTP_USER + SMTP_PASSWORD, ключ xsmtpsib-…).
// Ключи никогда не логируем и не отдаём наружу.
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const { mail } = env;
const hasSmtp = Boolean(mail.smtpUser && mail.smtpPassword);

/** Почта настроена: есть отправитель и хотя бы один способ отправки. */
export const mailEnabled = Boolean(mail.fromEmail && (mail.brevoApiKey || hasSmtp));

let transport: Transporter | null = null;
const smtp = () =>
  (transport ??= nodemailer.createTransport({
    host: mail.smtpHost,
    port: mail.smtpPort,
    secure: mail.smtpPort === 465,
    auth: { user: mail.smtpUser!, pass: mail.smtpPassword! },
  }));

async function viaApi(msg: Mail) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': mail.brevoApiKey!, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: mail.fromEmail, name: mail.fromName },
      to: [{ email: msg.to }],
      subject: msg.subject,
      htmlContent: msg.html,
      textContent: msg.text,
      tags: ['password-reset'],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Brevo API ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

export async function sendMail(msg: Mail) {
  if (!mailEnabled) throw new Error('Почта не настроена: задайте MAIL_FROM_EMAIL и SMTP_USER/SMTP_PASSWORD или BREVO_API_KEY');
  if (mail.brevoApiKey) return viaApi(msg);
  await smtp().sendMail({ from: { name: mail.fromName, address: mail.fromEmail! }, ...msg });
}
