'use client';

import { Suspense, useMemo, useRef, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { HoneypotField, useFormGuard } from '@/components/honeypot-field';
import { LEAD_TEXTAREA_MAX, buildLeadMessage } from '@/lib/forms';
import { trackEvent } from '@/lib/track-client';

export type ExtraField = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'date' | 'checkbox' | 'number';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  minLength?: number;
  min?: number;
  max?: number;
};

export type SummaryField = {
  name: string;
  label: string;
  fallback?: string;
};

type LeadFormProps = {
  leadType: string;
  title: string;
  description?: string;
  extraFields: ExtraField[];
  summaryFields: SummaryField[];
  summaryLeadLabel?: string;
  successRedirect?: string;
  defaultCompanyName?: string;
  /** Initial values for extra fields, e.g. a preselected service of interest. */
  defaultValues?: Record<string, string>;
  noteWarning?: string;
  onSubmitted?: () => void;
};

export function LeadForm(props: LeadFormProps) {
  return (
    <Suspense fallback={<div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-card sm:p-7"><p className="text-sm text-brand-muted">Loading form...</p></div>}>
      <LeadFormInner {...props} />
    </Suspense>
  );
}

function LeadFormInner({
  leadType,
  title,
  description,
  extraFields,
  summaryFields,
  summaryLeadLabel,
  successRedirect,
  defaultCompanyName,
  defaultValues,
  noteWarning,
  onSubmitted
}: LeadFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusRef = useRef<HTMLDivElement | null>(null);
  const { honeypotRef, guardFields } = useFormGuard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const allFields = useMemo(
    () => [
      { name: 'contact_name', label: 'Name', required: true } as ExtraField,
      { name: 'contact_email', label: 'Email', type: 'email', required: true } as ExtraField,
      { name: 'contact_phone', label: 'Phone', type: 'tel', required: true } as ExtraField,
      ...extraFields
    ],
    [extraFields]
  );

  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {};
    for (const field of allFields) {
      if (field.type === 'checkbox') {
        initial[field.name] = false;
      } else if (field.name === 'company_name') {
        initial[field.name] = defaultCompanyName || '';
      } else {
        initial[field.name] = defaultValues?.[field.name] || '';
      }
    }
    return initial;
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const utmMeta = useMemo(() => {
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    return Object.fromEntries(keys.map((k) => [k, searchParams.get(k) || undefined]));
  }, [searchParams]);

  function validateField(field: ExtraField, value: string | boolean) {
    if (field.required) {
      if (field.type === 'checkbox') {
        if (!Boolean(value)) return 'This field is required';
      } else if (!String(value || '').trim()) {
        if (field.name === 'age_range') return 'Age is required';
        return field.type === 'select' ? 'Please select an option' : 'This field is required';
      }
    }

    const text = String(value || '').trim();
    if (!text) return '';

    if (field.type === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(text)) return 'Must be a valid email address';
    }

    if (field.type === 'tel') {
      const digits = text.replace(/\D/g, '');
      if (digits.length < 7) return 'Must be a valid phone number';
    }

    if (field.type === 'number') {
      const numberValue = Number(text);
      if (!Number.isFinite(numberValue)) return field.name === 'age_range' ? 'Age is required' : 'Must be a valid number';
      if (field.min !== undefined && field.max !== undefined && (numberValue < field.min || numberValue > field.max)) {
        return field.name === 'age_range'
          ? `Age must be between ${field.min} and ${field.max}`
          : `Must be between ${field.min} and ${field.max}`;
      }
    }

    if (field.minLength && text.length < field.minLength) {
      return `Must be at least ${field.minLength} characters`;
    }

    return '';
  }

  function validateAll(current: Record<string, string | boolean>) {
    const next: Record<string, string> = {};
    for (const field of allFields) {
      const message = validateField(field, current[field.name]);
      if (message) next[field.name] = message;
    }
    return next;
  }

  const formHasErrors = useMemo(() => Object.keys(validateAll(values)).length > 0, [values, allFields]);

  function setFieldValue(name: string, value: string | boolean) {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      if (attemptedSubmit || touched[name]) {
        const field = allFields.find((item) => item.name === name);
        if (field) {
          const msg = validateField(field, value);
          setErrors((prevErrors) => {
            const updated = { ...prevErrors };
            if (msg) updated[name] = msg;
            else delete updated[name];
            return updated;
          });
        }
      }
      return next;
    });
  }

  function touchField(name: string) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const field = allFields.find((item) => item.name === name);
    if (!field) return;
    const message = validateField(field, values[name]);
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttemptedSubmit(true);
    const nextErrors = validateAll(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setError('Please fix the highlighted fields.');
      statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    const freeText = String(values.notes || '');
    const extras = Object.fromEntries(
      Object.entries(values).filter(([k]) => !['contact_name', 'contact_email', 'contact_phone', 'company_name', 'notes'].includes(k))
    );
    const meta = {
      lead_type: leadType,
      ...utmMeta,
      ...extras
    };

    const payload = {
      contact_name: String(values.contact_name || ''),
      contact_email: String(values.contact_email || ''),
      contact_phone: String(values.contact_phone || ''),
      company_name: String(values.company_name || defaultCompanyName || ''),
      page_path: pathname || undefined,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      ...utmMeta,
      ...guardFields(),
      message: buildLeadMessage(
        [
          `Lead Type: ${summaryLeadLabel || leadType}`,
          ...summaryFields.map((field) => `${field.label}: ${String(values[field.name] || field.fallback || 'Not provided')}`)
        ],
        meta,
        freeText
      )
    };

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Submission failed');
      setSuccess(true);
      trackEvent({ event_type: 'form_submit', form_name: leadType, page_path: pathname || undefined, ...utmMeta });
      onSubmitted?.();
      statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (successRedirect) {
        router.push(successRedirect);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-card sm:p-7">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-brand-ink">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-7 text-brand-muted">{description}</p> : null}
      </div>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <HoneypotField inputRef={honeypotRef} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="contact_name"
            label="Name"
            required
            value={values.contact_name}
            error={errors.contact_name}
            showError={attemptedSubmit || touched.contact_name}
            onChange={setFieldValue}
            onBlur={touchField}
          />
          <Field
            name="contact_email"
            label="Email"
            type="email"
            required
            value={values.contact_email}
            error={errors.contact_email}
            showError={attemptedSubmit || touched.contact_email}
            onChange={setFieldValue}
            onBlur={touchField}
          />
          <Field
            name="contact_phone"
            label="Phone"
            type="tel"
            required
            value={values.contact_phone}
            error={errors.contact_phone}
            showError={attemptedSubmit || touched.contact_phone}
            onChange={setFieldValue}
            onBlur={touchField}
          />
        </div>
        {extraFields.map((field) => (
          <Field
            key={field.name}
            {...field}
            value={values[field.name]}
            error={errors[field.name]}
            showError={attemptedSubmit || touched[field.name]}
            onChange={setFieldValue}
            onBlur={touchField}
          />
        ))}
        {noteWarning ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{noteWarning}</p> : null}
        <div ref={statusRef} className="space-y-2">
          {success && !successRedirect ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Thanks. We received your request and will follow up soon.</p> : null}
          {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        </div>
        <Button type="submit" className="w-full sm:w-auto" variant="primary" disabled={loading || formHasErrors}>
          {loading ? 'Submitting...' : 'Submit'}
        </Button>
        {!loading && formHasErrors ? <p className="text-xs text-brand-muted">Complete required fields to submit.</p> : null}
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = 'text',
  options,
  required,
  placeholder,
  helperText,
  min,
  max,
  value,
  error,
  showError,
  onChange,
  onBlur
}: ExtraField & {
  value: string | boolean | undefined;
  error?: string;
  showError?: boolean;
  onChange: (name: string, value: string | boolean) => void;
  onBlur: (name: string) => void;
}) {
  const id = `field-${name}`;
  const hasError = Boolean(showError && error);
  const classes = `mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-brand-ink outline-none transition duration-150 ease-out focus:ring-2 focus:ring-brand-primary/25 placeholder:text-brand-muted/60 focus:border-brand-primary ${hasError ? 'border-rose-400' : 'border-brand-ink/10'}`;
  return (
    <label className={type === 'textarea' ? 'block' : 'block'} htmlFor={id}>
      <span className="text-sm font-medium text-brand-ink">{label}{required ? ' *' : ''}</span>
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          required={required}
          placeholder={placeholder}
          className={`${classes} min-h-28`}
          maxLength={LEAD_TEXTAREA_MAX}
          value={String(value || '')}
          onChange={(event) => onChange(name, event.target.value)}
          onBlur={() => onBlur(name)}
          aria-invalid={hasError}
        />
      ) : type === 'select' ? (
        <select
          id={id}
          name={name}
          required={required}
          className={classes}
          value={String(value || '')}
          onChange={(event) => onChange(name, event.target.value)}
          onBlur={() => onBlur(name)}
          aria-invalid={hasError}
        >
          <option value="">Select...</option>
          {options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : type === 'checkbox' ? (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-brand-ink/10 bg-brand-cream/70 px-3 py-2">
          <input
            id={id}
            name={name}
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-brand-ink/20"
            checked={Boolean(value)}
            onChange={(event) => onChange(name, event.target.checked)}
            onBlur={() => onBlur(name)}
            aria-invalid={hasError}
          />
          <span className="text-sm text-brand-muted">{placeholder || helperText}</span>
        </div>
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={classes}
          value={String(value || '')}
          onChange={(event) => onChange(name, event.target.value)}
          onBlur={() => onBlur(name)}
          inputMode={type === 'tel' ? 'tel' : type === 'number' ? 'numeric' : undefined}
          pattern={type === 'tel' ? '[0-9()+\\-\\s.]{7,}' : type === 'number' ? '[0-9]*' : undefined}
          autoComplete={type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined}
          min={type === 'number' ? min : undefined}
          max={type === 'number' ? max : undefined}
          step={type === 'number' ? 1 : undefined}
          aria-invalid={hasError}
        />
      )}
      {hasError ? <span className="mt-1 block text-xs text-rose-700">{error}</span> : null}
      {helperText && type !== 'checkbox' ? <span className="mt-1 block text-xs text-brand-muted">{helperText}</span> : null}
    </label>
  );
}
