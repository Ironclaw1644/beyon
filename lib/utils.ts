import { clsx, type ClassValue } from 'clsx';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://beyonvital.com').replace(/\/$/, '');

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function siteUrl() {
  return SITE_URL;
}

export function absoluteUrl(path = '/') {
  const base = siteUrl();
  return path.startsWith('http') ? path : `${base}${path}`;
}

export function slugToTitle(slug: string) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatPhone(phone: string) {
  return phone.replace(/\D/g, '').slice(-10);
}
