import { AnnouncementItem } from '@/components/announcement-item.client';
import type { Announcement } from '@/lib/types';

export function AnnouncementList({ announcements }: { announcements: Announcement[] }) {
  if (!announcements.length) return null;

  return (
    <div className="space-y-3">
      {announcements.map((item) => (
        <AnnouncementItem key={item.id} id={item.id} title={item.title} body={item.body} />
      ))}
    </div>
  );
}
