import Image from 'next/image';
import { HOME_PHOTO_SIZE, type SiteImage } from '@/lib/content';
import { Reveal } from '@/components/reveal';

// Real photos of the Beyon Vital home.
export function PhotoGrid({ photos, sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' }: { photos: SiteImage[]; sizes?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo, index) => (
        <Reveal key={photo.src} delayMs={index * 60}>
          <div className="group overflow-hidden rounded-2xl border border-white/80 bg-white shadow-card">
            <Image
              src={photo.src}
              alt={photo.alt}
              width={HOME_PHOTO_SIZE.width}
              height={HOME_PHOTO_SIZE.height}
              sizes={sizes}
              className="aspect-[3/4] w-full object-cover transition duration-200 ease-out motion-safe:group-hover:scale-[1.02]"
            />
          </div>
        </Reveal>
      ))}
    </div>
  );
}
