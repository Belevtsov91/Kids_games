// Простое письмо в стиле сайта: ночное небо, белая карточка, крупные кнопки. Только таблицы и инлайн-стили —
// так письмо одинаково выглядит в Gmail, Outlook и на телефоне.

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

export interface MailButton {
  label: string;
  url: string;
  /** Вторая кнопка — светлая. */
  ghost?: boolean;
}

export interface SimpleMail {
  locale: string;
  subject: string;
  title: string;
  /** Абзацы; уже готовый HTML не принимаем — экранируем всё. */
  lines: string[];
  /** Строки таблицы «подпись — значение». */
  rows?: [string, string][];
  buttons?: MailButton[];
  footer: string;
}

const FONT = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const button = (b: MailButton) =>
  `<a href="${escapeHtml(b.url)}" style="display:inline-block;margin:6px 6px 0 0;padding:14px 22px;border-radius:14px;font:800 16px ${FONT};text-decoration:none;${
    b.ghost ? 'background:#efeaff;color:#2a2160;' : 'background:#ffd25a;color:#3d2a00;'
  }">${escapeHtml(b.label)}</a>`;

export function simpleMail(m: SimpleMail) {
  const rows = (m.rows ?? [])
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#6a6296;">${escapeHtml(k)}</td><td style="padding:6px 0;text-align:right;font-weight:700;">${escapeHtml(v)}</td></tr>`)
    .join('');
  const html = `<!doctype html><html lang="${m.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(m.subject)}</title></head>
<body style="margin:0;padding:0;background:#17153f;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#17153f;"><tr><td align="center" style="padding:28px 12px;">
<div style="font:700 13px ${FONT};color:#ffd25a;letter-spacing:3px;padding-bottom:10px;">★ INTERACT GAMES ★</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#fff8ec;border-radius:24px;"><tr><td style="padding:26px 24px;font:16px/1.5 ${FONT};color:#2a2160;">
<div style="font-size:40px;line-height:44px;">🐻</div>
<h1 style="margin:8px 0 12px;font:900 24px/1.25 ${FONT};">${escapeHtml(m.title)}</h1>
${m.lines.map((l) => `<p style="margin:0 0 12px;">${escapeHtml(l)}</p>`).join('')}
${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 12px;border-top:1px solid #e6def5;">${rows}</table>` : ''}
${(m.buttons ?? []).map(button).join('')}
</td></tr></table>
<div style="max-width:520px;font:12px/1.5 ${FONT};color:#a9a3d6;padding-top:14px;">${escapeHtml(m.footer)}</div>
</td></tr></table></body></html>`;
  const text = [m.title, '', ...m.lines, ...(m.rows ?? []).map(([k, v]) => `${k}: ${v}`), '', ...(m.buttons ?? []).map((b) => `${b.label}: ${b.url}`), '', m.footer].join('\n');
  return { subject: m.subject, html, text };
}
