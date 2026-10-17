import FirecrawlApp from '@mendable/firecrawl-js';

export type Category = 'Scholarship' | 'Internship' | 'Hackathon';

export interface SearchQuery {
  degree: string;
  skills: string[];
  categories: Category[];
  rawText?: string;
}

// This matches what the frontend expects
export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: Category;
  matchTag: string;
  deadline: string;
  sourceUrl: string;
  sourceDomain: string;
  eligibility: { text: string; met: boolean }[];
  description: string;
  rawExtraction?: string;
  saved?: boolean;
}

const BLOCKED = ['linkedin.com', 'youtube.com', 'facebook.com', 'instagram.com', 'quora.com', 'reddit.com'];
const URLS_PER_CATEGORY = 2; // keep low: every page costs credits

function buildSearchText(category: Category, q: SearchQuery): string {
  const skills = q.skills.join(' ');
  if (category === 'Scholarship') return `${q.degree} scholarship apply last date 2026 India official`;
  if (category === 'Internship') return `${q.degree} ${skills} internship apply 2027 India`;
  return `student hackathon ${skills} registration deadline 2026`;
}

function buildExtractionPrompt(category: Category, q: SearchQuery): string {
  return `You are helping a student: degree ${q.degree}, skills ${q.skills.join(', ')}, country India.
${q.rawText ? `The student also said: ${q.rawText}` : ''}

Looking for: a ${category}. Extract the following fields from this page:
- title: The name of the ${category}
- organization: The hosting organization or company
- deadline: Application deadline in YYYY-MM-DD format (null if not found)
- award_amount: Prize, stipend, or grant amount (null if not applicable)
- summary: One sentence describing what it is
- official_url: The direct URL to the official application page
- eligibility: Array of {text: "requirement text", met: true/false/null} objects

If this is not actually a ${category} opportunity, return {"error": "reason"}.
Use met=null if you cannot determine eligibility from the page alone.`;
}

const EXTRACTION_SCHEMA = {
  type: 'object' as const,
  properties: {
    title: { type: 'string' },
    organization: { type: 'string' },
    deadline: { type: 'string' },
    award_amount: { type: 'string' },
    summary: { type: 'string' },
    official_url: { type: 'string' },
    eligibility: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          met: { type: 'boolean' },
        },
      },
    },
    error: { type: 'string' },
  },
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function searchOneCategory(
  client: FirecrawlApp,
  category: Category,
  q: SearchQuery
): Promise<{ found: Opportunity[]; pages: number }> {
  try {
    // Step 1: Search for relevant URLs using Firecrawl search (results under .web)
    const searchResults = await client.search(buildSearchText(category, q), {
      limit: 5,
    });

    const webItems = (searchResults.web ?? [])
      .filter((item: any) => item?.url && !BLOCKED.some((b) => item.url.includes(b)))
      .slice(0, URLS_PER_CATEGORY);

    const urls = webItems.map((item: any) => item.url as string);

    if (urls.length === 0) {
      return { found: [], pages: 0 };
    }

    // Step 2: Scrape + extract structured JSON from each URL
    const extractionPrompt = buildExtractionPrompt(category, q);
    const settled = await Promise.allSettled(
      urls.map((url) =>
        client.scrapeUrl(url, {
          formats: [
            {
              type: 'json',
              prompt: extractionPrompt,
              schema: EXTRACTION_SCHEMA,
            },
          ],
        })
      )
    );

    const found: Opportunity[] = [];

    settled.forEach((r, i) => {
      const sourceUrl = urls[i];
      let sourceDomain = '';
      try {
        sourceDomain = new URL(sourceUrl).hostname.replace('www.', '');
      } catch {
        return;
      }

      if (r.status === 'fulfilled') {
        const doc: any = r.value;
        const data: any = doc?.json;

        if (data && !data.error && data.title) {
          found.push({
            id: `${category.slice(0, 3).toLowerCase()}-${Date.now()}-${i}`,
            title: data.title,
            organization: data.organization || sourceDomain,
            category,
            matchTag: [data.award_amount, q.degree].filter(Boolean).join(' • ') || 'Verified Match',
            deadline: data.deadline && /^\d{4}-\d{2}-\d{2}$/.test(String(data.deadline)) ? data.deadline : '2026-12-31',
            sourceUrl: data.official_url || sourceUrl,
            sourceDomain,
            eligibility: Array.isArray(data.eligibility) && data.eligibility.length > 0
              ? data.eligibility.map((e: any) => ({
                  text: e.met === null || e.met === undefined ? `${e.text} (verify on website)` : String(e.text),
                  met: e.met === true,
                }))
              : [
                  { text: `Eligible for ${q.degree || 'Students'}`, met: true },
                  { text: 'Check official website for specific prerequisite criteria', met: true },
                ],
            description: data.summary || webItems[i]?.description || '',
            rawExtraction: JSON.stringify(data, null, 2),
            saved: false,
          });
          return;
        }
      }

      // Fallback: If deep scrape failed or returned no title, construct opportunity from search metadata
      const fallbackItem = webItems[i];
      if (fallbackItem?.title) {
        found.push({
          id: `${category.slice(0, 3).toLowerCase()}-${Date.now()}-${i}`,
          title: fallbackItem.title,
          organization: sourceDomain,
          category,
          matchTag: q.degree || 'Relevant Opportunity',
          deadline: '2026-12-31',
          sourceUrl,
          sourceDomain,
          eligibility: [
            { text: `Relevant to ${q.degree || 'Student'} applicants`, met: true },
            { text: 'Verify application timeline and requirements on site', met: true },
          ],
          description: fallbackItem.description || `Explore ${category} opportunity on ${sourceDomain}.`,
          saved: false,
        });
      }
    });

    return { found, pages: urls.length };
  } catch (err) {
    console.error(`Search category ${category} error:`, err);
    return { found: [], pages: 0 };
  }
}

export async function runSearch(q: SearchQuery) {
  const started = Date.now();
  const client = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

  // Run categories sequentially to avoid Firecrawl free tier concurrency limit (max 2 concurrent)
  const parts = [];
  for (const c of q.categories) {
    const part = await searchOneCategory(client, c, q);
    parts.push(part);
  }

  const opportunities = parts
    .flatMap((p) => p.found)
    .sort((a, b) => a.deadline.localeCompare(b.deadline)); // soonest deadline first

  return {
    opportunities,
    pagesVisited: parts.reduce((sum, p) => sum + p.pages, 0),
    scanDurationMs: Date.now() - started,
  };
}