import Image from 'next/image';
import { cn } from '@/lib/utils';

// Wrapper for AI-generated / stock lifestyle images. Always captioned so no one
// mistakes the people pictured for Beyon Vital staff or residents.
export function IllustrativeImage({
  src,
  alt,
  sizes,
  className,
  priority
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure className="w-full">
      <div className={cn('relative w-full overflow-hidden rounded-2xl bg-brand-accent/20', className || 'aspect-[3/2]')}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
      <figcaption className="mt-1.5 text-xs text-brand-muted">Illustrative image</figcaption>
    </figure>
  );
}
