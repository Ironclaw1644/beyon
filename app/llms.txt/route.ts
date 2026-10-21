import { llmsTxt } from '@/lib/seo/llms';

export const dynamic = 'force-static';

export function GET() {
  return new Response(llmsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
  });
}
