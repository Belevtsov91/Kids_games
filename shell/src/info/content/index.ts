import type { Locale } from '@ig/sdk';
import type { InfoContent, InfoSlug } from '../types';
import * as en from './en';
import * as ro from './ro';
import * as ru from './ru';
import * as uk from './uk';

type Pages = typeof ru;

const bySlug = (p: Pages): Record<InfoSlug, InfoContent> => ({
  privacy: p.privacy,
  terms: p.terms,
  cookies: p.cookies,
  kids: p.kids,
  'delete-account': p.deleteAccount,
  credits: p.credits,
  about: p.about,
  parents: p.parents,
  help: p.help,
  contact: p.contact,
});

/** Все информационные страницы по языку и адресу. */
export const INFO_PAGES: Record<Locale, Record<InfoSlug, InfoContent>> = {
  ru: bySlug(ru),
  uk: bySlug(uk),
  ro: bySlug(ro),
  en: bySlug(en),
};
