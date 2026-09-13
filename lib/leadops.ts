import { assertTopLevelLead } from '@/lib/forms';

function normalizeEnvValue(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function envRequired(name: string) {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Missing env var: ${name}`);
  return normalizeEnvValue(value);
}

const REQUIRED_ENV_VARS = ['LEADOPS_API_ROUTE', 'LEADOPS_TOKEN', 'LEADOPS_SOURCE'] as const;

export function getMissingLeadOpsEnvVars() {
  return REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim());
}

export async function forwardLead(body: unknown, extra?: Record<string, unknown>) {
  const payload = assertTopLevelLead(body);
  const route = envRequired('LEADOPS_API_ROUTE');
  if (!/^https:\/\//i.test(route)) {
    throw new Error('LeadOps forward_skipped — LEADOPS_API_ROUTE must be a full https URL');
  }
  const token = envRequired('LEADOPS_TOKEN');
  const ingestKey = process.env.LEADOPS_INGEST_KEY?.trim()
    ? normalizeEnvValue(process.env.LEADOPS_INGEST_KEY)
    : token;
  const source = envRequired('LEADOPS_SOURCE');

  const requestBody = {
    source,
    ...payload,
    ...(extra || {})
  };

  const res = await fetch(route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-leadops-token': token,
      'x-ingest-key': ingestKey,
      'x-leadops-ingest-key': ingestKey
    },
    body: JSON.stringify(requestBody),
    cache: 'no-store'
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const detail =
      typeof (data as { message?: unknown })?.message === 'string'
        ? (data as { message: string }).message
        : typeof (data as { error?: unknown })?.error === 'string'
          ? (data as { error: string }).error
          : typeof text === 'string' && text.trim()
            ? text.trim().slice(0, 300)
            : '';

    if (res.status === 401) {
      throw new Error('LeadOps auth failed — check LEADOPS_TOKEN/LEADOPS_INGEST_KEY in Vercel');
    }
    throw new Error(
      detail
        ? `LeadOps submit failed (${res.status}): ${detail}`
        : `LeadOps submit failed (${res.status}). Check LeadOps route and payload format.`
    );
  }

  return data;
}
