import type { InfoContent, InfoSlug } from '../types';
import { privacy, terms } from './legal';
import { cookies, deleteAccount, kids } from './policies';
import { about, contact, credits } from './project';
import { help, parents } from './parents';

/** Все информационные страницы по адресу. */
export const INFO_PAGES: Record<InfoSlug, InfoContent> = {
  privacy,
  terms,
  cookies,
  kids,
  'delete-account': deleteAccount,
  credits,
  about,
  parents,
  help,
  contact,
};
