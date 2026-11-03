// Письмо «Восстановить пароль» в стиле сайта: ночное небо, облака, летающий остров с мишкой-стражем и волшебной дверью.
// Почтовые программы не умеют WebGL, SVG и внешние стили, поэтому картинка собрана из таблиц, скруглений и эмодзи:
// без загрузки изображений письмо выглядит одинаково и в Gmail, и в Outlook, и на телефоне.
import { RESET_MAIL_TEXT, type MailLocale } from './text.js';

const C = {
  night: '#17153f',
  dusk: '#2b2170',
  gold: '#ffd25a',
  goldDark: '#d9a520',
  pink: '#ff7eb6',
  sky: '#7ee7ff',
  grass: '#7ef09a',
  grassDark: '#3fae62',
  rock: '#8a5a3a',
  rockDark: '#5e3b26',
  cream: '#fff8ec',
  ink: '#2a2160',
  inkSoft: '#6a6296',
};
const FONT = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const DISPLAY = "'Segoe UI Black', 'Arial Black', 'Segoe UI', Arial, sans-serif";

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

/** Облако: несколько белых «пузырей» разного размера в одну линию. */
const cloud = (sizes: number[], opacity: number, align: 'left' | 'right' | 'center') => `
  <div style="text-align:${align};line-height:0;opacity:${opacity};font-size:0;">${sizes
    .map((s, i) => `<span style="display:inline-block;width:${s * 1.6}px;height:${s}px;margin-left:-${i ? s / 3 : 0}px;background:#ffffff;border-radius:${s}px;vertical-align:bottom;"></span>`)
    .join('')}</div>`;

const stars = (line: string) =>
  `<div style="font-size:12px;line-height:18px;letter-spacing:14px;color:${C.gold};text-align:center;white-space:nowrap;overflow:hidden;">${line}</div>`;

/** Летающий остров: трава с мишкой, дверью и почтовым ящиком, под ней скала-конус и камушки. */
const island = (bubble: string) => `
  <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr><td align="center" style="padding:0 0 6px;">
      <span style="display:inline-block;max-width:240px;padding:9px 14px;background:${C.cream};color:${C.ink};border-radius:16px;font:700 13px/1.35 ${FONT};box-shadow:0 4px 0 rgba(0,0,0,.18);">${bubble}</span>
      <div style="width:0;height:0;margin:0 auto;border-left:8px solid transparent;border-right:8px solid transparent;border-top:9px solid ${C.cream};"></div>
    </td></tr>
    <tr><td align="center" valign="bottom" style="font-size:40px;line-height:40px;height:46px;">
      <span style="font-size:30px;">🌳</span><span style="font-size:44px;">🐻</span><span style="font-size:40px;">🚪</span><span style="font-size:14px;">🌼</span><span style="font-size:26px;">📮</span><span style="font-size:14px;">🌷</span>
    </td></tr>
    <tr><td style="width:280px;height:22px;margin-top:-6px;background:${C.grass};background-image:linear-gradient(180deg,${C.grass},${C.grassDark});border-radius:22px 22px 6px 6px;font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr><td align="center" style="line-height:0;font-size:0;">
      <div style="width:240px;height:58px;margin:0 auto;background:${C.rock};background-image:linear-gradient(180deg,${C.rock},${C.rockDark});border-radius:0 0 120px 120px / 0 0 58px 58px;"></div>
      <div style="width:70px;height:26px;margin:-2px auto 0;background:${C.rockDark};border-radius:0 0 35px 35px / 0 0 26px 26px;"></div>
    </td></tr>
    <tr><td align="center" style="padding:8px 0 0;font-size:0;line-height:0;">
      <span style="display:inline-block;width:10px;height:10px;background:${C.rock};border-radius:5px;margin:0 22px 0 0;"></span>
      <span style="display:inline-block;width:7px;height:7px;background:${C.rockDark};border-radius:4px;"></span>
      <div style="width:160px;height:10px;margin:14px auto 0;background:rgba(23,21,63,.35);border-radius:80px;opacity:.6;"></div>
    </td></tr>
  </table>`;

export interface ResetMail {
  subject: string;
  html: string;
  text: string;
}

export function resetPasswordMail(opts: { locale: MailLocale; name: string; url: string; minutes: number }): ResetMail {
  const t = RESET_MAIL_TEXT[opts.locale];
  const name = escape(opts.name);
  const url = escape(opts.url);

  const html = `<!doctype html>
<html lang="${opts.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escape(t.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${C.night};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(t.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.night};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td align="center" style="padding:0 0 16px;font:900 18px/1 ${DISPLAY};color:${C.cream};">
      <span style="font-size:22px;">🐻</span>&nbsp; Interact Games
    </td></tr>
    <tr><td style="background:${C.dusk};background-image:linear-gradient(180deg,${C.night} 0%,${C.dusk} 45%,#6b3f8f 80%,${C.pink} 100%);border-radius:28px 28px 0 0;padding:22px 18px 18px;">
      ${stars('✦ · ✧ · · ✦ · ✧')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="50%" valign="top" style="padding:10px 0 0 6px;">${cloud([26, 36, 24], 0.9, 'left')}</td>
        <td width="50%" valign="top" align="right" style="padding:0 6px 0 0;font-size:34px;line-height:40px;">🌙</td>
      </tr></table>
      ${island(escape(t.bear))}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="55%" style="padding:6px 0 0;">${stars('· ✧ ·')}</td>
        <td width="45%" style="padding:10px 4px 0 0;">${cloud([20, 30, 22, 16], 0.75, 'right')}</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:${C.cream};border-radius:0 0 28px 28px;padding:30px 30px 26px;font:400 16px/1.55 ${FONT};color:${C.ink};">
      <div style="text-align:center;font-size:40px;line-height:48px;">🗝️</div>
      <p style="margin:6px 0 4px;text-align:center;color:${C.inkSoft};font:700 15px/1.4 ${FONT};">${escape(t.hello(opts.name)).replace(escape(opts.name), `<b style="color:${C.ink};">${name}</b>`)}</p>
      <h1 style="margin:0 0 14px;text-align:center;font:900 26px/1.15 ${DISPLAY};color:${C.ink};">${escape(t.title)}</h1>
      <p style="margin:0 0 24px;text-align:center;">${escape(t.lead)}</p>
      <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
        <td align="center" bgcolor="${C.gold}" style="border-radius:18px;background:${C.gold};border-bottom:5px solid ${C.goldDark};">
          <a href="${url}" target="_blank" style="display:inline-block;padding:16px 30px;font:900 17px/1.2 ${DISPLAY};color:${C.ink};text-decoration:none;border-radius:18px;">✨ ${escape(t.button)}</a>
        </td>
      </tr></table>
      <p style="margin:18px 0 0;text-align:center;">
        <span style="display:inline-block;padding:6px 14px;background:#ffe9b0;color:#7a5600;border-radius:999px;font:700 13px/1.4 ${FONT};">⏳ ${escape(t.expires(opts.minutes))}</span>
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;"><tr>
        <td style="background:#efeaff;border-radius:16px;padding:14px 16px;font:400 14px/1.5 ${FONT};color:${C.inkSoft};">🛡️ ${escape(t.ignore)}</td>
      </tr></table>
      <p style="margin:20px 0 6px;font:400 13px/1.5 ${FONT};color:${C.inkSoft};">${escape(t.fallback)}</p>
      <p style="margin:0;font:400 12px/1.5 ${FONT};word-break:break-all;"><a href="${url}" target="_blank" style="color:#5b3fd0;">${url}</a></p>
    </td></tr>
    <tr><td align="center" style="padding:18px 20px 6px;font:400 12px/1.6 ${FONT};color:#a9a2d6;">
      ${stars('✦ · ✧')}
      ${escape(t.footer)}<br>© Interact Games
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  const text = [t.hello(opts.name), '', t.title, '', t.lead, '', `${t.button}: ${opts.url}`, '', t.expires(opts.minutes), t.ignore, '', '— Interact Games 🐻'].join('\n');
  return { subject: t.subject, html, text };
}
