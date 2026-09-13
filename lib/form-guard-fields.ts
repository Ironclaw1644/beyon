// Field names shared by the client forms and the server-side spam guard.

/** Hidden input that humans never see or fill; bots that fill every field trip it. */
export const HONEYPOT_FIELD = 'website';

/** Milliseconds between the form mounting and its submission (clock-skew free). */
export const ELAPSED_FIELD = 'form_elapsed_ms';

export const MIN_FORM_ELAPSED_MS = 3000;
