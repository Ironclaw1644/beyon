'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { ELAPSED_FIELD, HONEYPOT_FIELD } from '@/lib/form-guard-fields';

/** Spam-guard values to spread into a form's JSON payload. */
export function useFormGuard() {
  const startedAt = useRef<number | null>(null);
  const honeypotRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    startedAt.current = performance.now();
  }, []);

  const guardFields = useCallback(
    () => ({
      [HONEYPOT_FIELD]: honeypotRef.current?.value || '',
      [ELAPSED_FIELD]: startedAt.current === null ? 0 : Math.round(performance.now() - startedAt.current)
    }),
    []
  );

  return { honeypotRef, guardFields };
}

export function HoneypotField({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) {
  return (
    <div aria-hidden="true" className="sr-only">
      <label>
        Leave this field empty
        <input ref={inputRef} type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
