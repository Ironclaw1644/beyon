'use client';

import { useId, useMemo, useState } from 'react';
import { Card } from '@/components/ui';

type AnnouncementItemProps = {
  id: string;
  title: string;
  body: string;
};

const LONG_BODY_THRESHOLD = 300;

export function AnnouncementItem({ id, title, body }: AnnouncementItemProps) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const shouldToggle = useMemo(() => body.trim().length > LONG_BODY_THRESHOLD, [body]);

  return (
    <Card key={id} className="border-brand-primary/15">
      <p className="text-sm font-semibold text-brand-ink">{title}</p>
      <p
        id={contentId}
        className={`mt-2 text-sm leading-7 text-brand-muted ${!expanded && shouldToggle ? 'announcement-clamp' : ''}`}
      >
        {body}
      </p>
      {shouldToggle ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-brand-primary font-medium hover:underline"
        >
          {expanded ? 'Read less' : 'Read more...'}
        </button>
      ) : null}
    </Card>
  );
}
