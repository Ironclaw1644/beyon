import 'server-only';

export function formatEmailDateTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  try {
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'America/New_York' }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }
}
