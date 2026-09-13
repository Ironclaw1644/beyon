import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database, CmsSchemaName } from '@/lib/supabase/cms.types';

/**
 * The only Supabase schema this app reads or writes. Centralized here so nothing
 * else hardcodes a schema literal. CMS_SCHEMA / SUPABASE_SCHEMA may be set, but
 * anything other than `beyon` is rejected rather than silently used.
 */
export const CMS_SCHEMA: CmsSchemaName = 'beyon';

function firstEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  throw new Error(`Missing env var: ${names.join(' or ')}`);
}

export function getCmsSchema(): CmsSchemaName {
  const requested = (process.env.CMS_SCHEMA || process.env.SUPABASE_SCHEMA || CMS_SCHEMA).trim();
  if (requested !== CMS_SCHEMA) {
    throw new Error(`Invalid schema: ${requested}. Expected ${CMS_SCHEMA}`);
  }
  return CMS_SCHEMA;
}

export function cmsServerClient() {
  const url = firstEnv(['CMS_SUPABASE_URL', 'SUPABASE_URL']);
  const serviceRole = firstEnv(['CMS_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY']);
  const schema = getCmsSchema();
  const client = createClient<Database>(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return client.schema(schema);
}
