// ─── TinyFish Service Layer ──────────────────────────────────────────────────
// Abstracts all API calls for live connection. Replace mock data with real
// TinyFish API keys to go live in minutes.

export interface SearchQuery {
  degree: string;
  skills: string[];
  categories: ('Scholarship' | 'Internship' | 'Hackathon')[];
  rawText?: string;
}

export interface EligibilityItem {
  text: string;
  met: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: 'Scholarship' | 'Internship' | 'Hackathon';
  matchTag: string;
  deadline: string; // ISO date string
  sourceUrl: string;
  sourceDomain: string;
  eligibility: EligibilityItem[];
  description: string;
  rawExtraction?: string;
  saved?: boolean;
}

export interface SearchResult {
  opportunities: Opportunity[];
  pagesVisited: number;
  scanDurationMs: number;
}

export interface TinyFishConfig {
  searchApiKey?: string;
  fetchApiKey?: string;
  webAgentApiKey?: string;
  baseUrl?: string;
}

// ─── Search API ───────────────────────────────────────────────────────────────
// Live: POST https://api.tinyfish.io/v1/search
export async function searchOpportunities(
  query: SearchQuery,
  config?: TinyFishConfig
): Promise<{ results: string[]; queryId: string }> {
  if (!config?.searchApiKey) {
    // Mock — swap out with real API call
    return {
      results: ['mock_result_1', 'mock_result_2'],
      queryId: `q_${Date.now()}`,
    };
  }

  const response = await fetch(`${config.baseUrl}/v1/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.searchApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: buildSearchQuery(query),
      num_results: 30,
    }),
  });

  if (!response.ok) throw new Error(`Search API error: ${response.status}`);
  return response.json();
}

// ─── Web Agent ────────────────────────────────────────────────────────────────
// Live: POST https://api.tinyfish.io/v1/agent/navigate
export async function runWebAgent(
  urls: string[],
  config?: TinyFishConfig
): Promise<{ visitedPages: number; extractedData: Record<string, unknown>[] }> {
  if (!config?.webAgentApiKey) {
    return { visitedPages: urls.length, extractedData: [] };
  }

  const response = await fetch(`${config.baseUrl}/v1/agent/navigate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.webAgentApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ urls, task: 'extract_opportunity_details' }),
  });

  if (!response.ok) throw new Error(`Web Agent error: ${response.status}`);
  return response.json();
}

// ─── Fetch API ────────────────────────────────────────────────────────────────
// Live: POST https://api.tinyfish.io/v1/fetch
export async function fetchPageData(
  url: string,
  extractionSchema: Record<string, string>,
  config?: TinyFishConfig
): Promise<{ deadline?: string; eligibility?: string[]; rawMarkdown?: string }> {
  if (!config?.fetchApiKey) {
    return {};
  }

  const response = await fetch(`${config.baseUrl}/v1/fetch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.fetchApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, schema: extractionSchema }),
  });

  if (!response.ok) throw new Error(`Fetch API error: ${response.status}`);
  return response.json();
}

// ─── Full Search Pipeline ────────────────────────────────────────────────────
// Calls YOUR backend (the TinyFish keys live there, never in the browser).
const BACKEND_URL = 'http://localhost:3000';

export async function runFullSearch(
  query: SearchQuery,
  _config?: TinyFishConfig
): Promise<SearchResult> {
  const response = await fetch(`${BACKEND_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }
  return response.json();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildSearchQuery(query: SearchQuery): string {
  const parts = [
    query.degree,
    ...query.skills,
    ...query.categories,
    query.rawText,
  ].filter(Boolean);
  return `student opportunities ${parts.join(' ')}`;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
// 9 realistic opportunities (3 × category) with real domains & late-2026 deadlines
export const MOCK_OPPORTUNITIES: Opportunity[] = [
  // ── Scholarships ──
  {
    id: 'sch-001',
    title: 'Google Generation Scholarship',
    organization: 'Google',
    category: 'Scholarship',
    matchTag: '$10,000 Grant • B.Tech / AI/ML',
    deadline: '2026-11-12',
    sourceUrl: 'https://buildyourfuture.withgoogle.com/scholarships/google-scholarship',
    sourceDomain: 'buildyourfuture.withgoogle.com',
    eligibility: [
      { text: 'Enrolled full-time in B.Tech/B.S. Computer Science or related field', met: true },
      { text: 'Demonstrate strong academic performance (GPA ≥ 3.2 / 8.0 CGPA)', met: true },
      { text: 'Demonstrate financial need via FAFSA or equivalent', met: false },
      { text: 'Residing in eligible country (US, Canada, or listed APAC)', met: true },
    ],
    description:
      'Google Generation Scholarship supports exceptional undergrad and graduate students studying CS or tech-related fields who demonstrate leadership and passion for technology.',
    rawExtraction: `## TinyFish Fetch Extraction\n\n**Source:** buildyourfuture.withgoogle.com\n**Fetched:** 2026-10-15T13:42:00Z\n\n### Extracted Fields\n\`\`\`json\n{\n  "deadline": "2026-11-12",\n  "award_amount": "$10,000 USD",\n  "eligibility": [\n    "Full-time enrollment in B.Tech/B.S.",\n    "GPA ≥ 3.2",\n    "Financial need",\n    "Eligible country"\n  ],\n  "application_url": "https://buildyourfuture.withgoogle.com/scholarships/google-scholarship",\n  "confidence_score": 0.97\n}\n\`\`\``,
    saved: false,
  },
  {
    id: 'sch-002',
    title: 'Microsoft Research PhD Fellowship',
    organization: 'Microsoft Research',
    category: 'Scholarship',
    matchTag: '$42,000/yr • Ph.D. • AI/ML',
    deadline: '2026-12-01',
    sourceUrl: 'https://www.microsoft.com/en-us/research/academic-program/phd-fellowship/',
    sourceDomain: 'microsoft.com',
    eligibility: [
      { text: 'Enrolled in a PhD program in CS, EE, or related field', met: true },
      { text: 'Research focus in AI, ML, Systems, or Security', met: true },
      { text: 'Nomination by faculty advisor required', met: false },
      { text: 'Must be in second or third year of PhD program', met: true },
    ],
    description:
      'Microsoft Research PhD Fellowship program funds exceptional PhD students conducting breakthrough research in computer science and related technical disciplines.',
    rawExtraction: `## TinyFish Fetch Extraction\n\n**Source:** microsoft.com\n**Fetched:** 2026-10-15T13:44:00Z\n\n### Extracted Fields\n\`\`\`json\n{\n  "deadline": "2026-12-01",\n  "award_amount": "$42,000/year for 2 years",\n  "eligibility": [\n    "PhD enrollment",\n    "AI/ML focus",\n    "Faculty nomination",\n    "Year 2-3 of PhD"\n  ],\n  "confidence_score": 0.95\n}\n\`\`\``,
    saved: false,
  },
  {
    id: 'sch-003',
    title: 'Adobe Research Women-in-Technology Scholarship',
    organization: 'Adobe Research',
    category: 'Scholarship',
    matchTag: '$10,000 Grant • Undergrad • Design/AI',
    deadline: '2026-10-25',
    sourceUrl: 'https://research.adobe.com/scholarship/',
    sourceDomain: 'research.adobe.com',
    eligibility: [
      { text: 'Self-identify as a woman or non-binary individual', met: true },
      { text: 'Enrolled in B.S., M.S., or PhD in CS or Design', met: true },
      { text: 'GPA ≥ 3.0 on a 4.0 scale', met: true },
      { text: 'Research or project experience in graphics, AI, or design tools', met: false },
    ],
    description:
      'Adobe celebrates women in technology by awarding scholarships to exceptional female and non-binary students studying CS or creative technology disciplines.',
    rawExtraction: `## TinyFish Fetch Extraction\n\n**Source:** research.adobe.com\n**Fetched:** 2026-10-15T13:46:00Z\n\n### Extracted Fields\n\`\`\`json\n{\n  "deadline": "2026-10-25",\n  "award_amount": "$10,000 USD",\n  "eligibility": [\n    "Women/non-binary",\n    "CS/Design enrollment",\n    "GPA ≥ 3.0",\n    "Research experience"\n  ],\n  "confidence_score": 0.93\n}\n\`\`\``,
    saved: false,
  },

  // ── Internships ──
  {
    id: 'int-001',
    title: 'Google STEP Internship Program',
    organization: 'Google',
    category: 'Internship',
    matchTag: 'B.Tech • Python/ML • ₹1.8L/month',
    deadline: '2026-11-30',
    sourceUrl: 'https://careers.google.com/programs/step/',
    sourceDomain: 'careers.google.com',
    eligibility: [
      { text: 'Currently pursuing B.Tech/B.S. in CS, Math, or related field', met: true },
      { text: 'Completed at least one year of undergraduate study', met: true },
      { text: 'Strong programming skills in Python, Java, or C++', met: true },
      { text: 'Available for 12–14 week internship (Summer 2027)', met: true },
    ],
    description:
      'STEP (Student Training in Engineering Program) is a 12-week internship for first and second year undergrad students with a passion for CS and technical problem solving.',
    rawExtraction: `## TinyFish Fetch Extraction\n\n**Source:** careers.google.com\n**Fetched:** 2026-10-15T13:48:00Z\n\n### Extracted Fields\n\`\`\`json\n{\n  "deadline": "2026-11-30",\n  "stipend": "₹1,80,000/month (India)",\n  "duration": "12-14 weeks",\n  "start_date": "Summer 2027",\n  "eligibility": [\n    "B.Tech/B.S. enrollment",\n    "Year 1 or 2",\n    "Python/Java/C++",\n    "12-14 week availability"\n  ],\n  "confidence_score": 0.98\n}\n\`\`\``,
    saved: false,
  },
  {
    id: 'int-002',
    title: 'Stripe Engineering Internship',
    organization: 'Stripe',
    category: 'Internship',
    matchTag: 'M.S./B.Tech • React/Python • $8,000/month',
    deadline: '2026-12-15',
    sourceUrl: 'https://stripe.com/jobs/university',
    sourceDomain: 'stripe.com',
    eligibility: [
      { text: 'Currently pursuing B.Tech, M.S., or equivalent in CS', met: true },
      { text: 'Experience with distributed systems or web infrastructure', met: false },
      { text: 'Strong fundamentals in data structures and algorithms', met: true },
      { text: 'Can commit to 16-week internship (Summer 2027)', met: true },
    ],
    description:
      'Stripe engineering interns work on real, high-impact infrastructure used by millions of businesses globally—from API design to fraud detection pipelines.',
    rawExtraction: `## TinyFish Fetch Extraction\n\n**Source:** stripe.com\n**Fetched:** 2026-10-15T13:50:00Z\n\n### Extracted Fields\n\`\`\`json\n{\n  "deadline": "2026-12-15",\n  "stipend": "$8,000/month USD",\n  "duration": "16 weeks",\n  "eligibility": [\n    "CS enrollment",\n    "Distributed systems experience",\n    "Strong DSA fundamentals",\n    "16-week availability"\n  ],\n  "confidence_score": 0.94\n}\n\`\`\``,
    saved: false,
  },
  {
    id: 'int-003',
    title: 'DeepMind Research Internship',
    organization: 'DeepMind',
    category: 'Internship',
    matchTag: 'Ph.D./M.S. • AI/ML • London/Remote',
    deadline: '2026-11-01',
    sourceUrl: 'https://deepmind.google/about/careers/',
    sourceDomain: 'deepmind.google',
    eligibility: [
      { text: 'Enrolled in M.S. or PhD program in ML, CS, or Mathematics', met: true },
      { text: 'Strong publication record or equivalent research experience', met: false },
      { text: 'Proficiency in Python and deep learning frameworks (JAX, PyTorch)', met: true },
      { text: 'Available for 12-week placement in London or remote', met: true },
    ],
    description:
      'DeepMind research internships place exceptional students alongside world-leading researchers working on AGI, reinforcement learning, and protein structure prediction.',
    rawExtraction: `## TinyFish Fetch Extraction\n\n**Source:** deepmind.google\n**Fetched:** 2026-10-15T13:52:00Z\n\n### Extracted Fields\n\`\`\`json\n{\n  "deadline": "2026-11-01",\n  "stipend": "Competitive (undisclosed)",\n  "location": "London, UK / Remote",\n  "duration": "12 weeks",\n  "eligibility": [\n    "M.S./PhD enrollment",\n    "Research publications",\n    "Python/JAX/PyTorch",\n    "London or remote"\n  ],\n  "confidence_score": 0.91\n}\n\`\`\``,
    saved: false,
  },

  // ── Hackathons ──
  {
    id: 'hack-001',
    title: 'MLH Global Hack Week: AI',
    organization: 'Major League Hacking',
    category: 'Hackathon',
    matchTag: 'B.Tech • AI/ML • $5,000 Prize Pool',
    deadline: '2026-10-28',
    sourceUrl: 'https://mlh.io/seasons/2027/events',
    sourceDomain: 'mlh.io',
    eligibility: [
      { text: 'Currently enrolled student at any college/university worldwide', met: true },
      { text: 'Team size of 1–4 members', met: true },
      { text: 'Project must use at least one AI/ML technology or API', met: true },
      { text: 'No prior hackathon wins required — beginners welcome', met: true },
    ],
    description:
      'MLH Global Hack Week AI is a week-long virtual hackathon series where students build projects using cutting-edge AI tools, compete for prizes, and network with sponsors.',
    rawExtraction: `## TinyFish Fetch Extraction\n\n**Source:** mlh.io\n**Fetched:** 2026-10-15T13:54:00Z\n\n### Extracted Fields\n\`\`\`json\n{\n  "deadline": "2026-10-28",\n  "prize_pool": "$5,000 USD",\n  "format": "Virtual, 7 days",\n  "team_size": "1-4 members",\n  "eligibility": [\n    "Enrolled student",\n    "1-4 member team",\n    "AI/ML project required",\n    "All skill levels"\n  ],\n  "confidence_score": 0.96\n}\n\`\`\``,
    saved: false,
  },
  {
    id: 'hack-002',
    title: 'Smart India Hackathon 2027',
    organization: 'Ministry of Education, India',
    category: 'Hackathon',
    matchTag: 'B.Tech • Python/React • ₹1,00,000 Prize',
    deadline: '2026-12-20',
    sourceUrl: 'https://www.sih.gov.in',
    sourceDomain: 'sih.gov.in',
    eligibility: [
      { text: 'Indian citizen enrolled in B.Tech/M.Tech at an AICTE-approved institute', met: true },
      { text: 'Team of exactly 6 members with 1 faculty mentor', met: false },
      { text: 'Solution addresses one of the listed problem statements', met: true },
      { text: 'No restrictions on technology stack used', met: true },
    ],
    description:
      'Smart India Hackathon is a national initiative to provide students with a platform to solve real problems of organizations in India through innovative technology solutions.',
    rawExtraction: `## TinyFish Fetch Extraction\n\n**Source:** sih.gov.in\n**Fetched:** 2026-10-15T13:56:00Z\n\n### Extracted Fields\n\`\`\`json\n{\n  "deadline": "2026-12-20",\n  "prize_pool": "₹1,00,000 INR per winning team",\n  "format": "In-person, 36 hours",\n  "team_size": "6 members + 1 faculty",\n  "eligibility": [\n    "Indian citizen",\n    "AICTE-approved institute",\n    "Team of 6 + mentor",\n    "Listed problem statement"\n  ],\n  "confidence_score": 0.89\n}\n\`\`\``,
    saved: false,
  },
  {
    id: 'hack-003',
    title: 'Devpost × Anthropic AI Hackathon',
    organization: 'Devpost / Anthropic',
    category: 'Hackathon',
    matchTag: 'All Degrees • AI/ML • $20,000 Grand Prize',
    deadline: '2026-11-18',
    sourceUrl: 'https://devpost.com/hackathons',
    sourceDomain: 'devpost.com',
    eligibility: [
      { text: 'Open to all developers worldwide (students and professionals)', met: true },
      { text: 'Project must use Anthropic Claude API in a meaningful way', met: true },
      { text: 'Team size of 1–5 members', met: true },
      { text: 'Submission must include working demo and public GitHub repo', met: false },
    ],
    description:
      "Build the most impactful AI application using Anthropic's Claude API. Compete for a $20,000 grand prize and showcase your project to industry judges from top AI labs.",
    rawExtraction: `## TinyFish Fetch Extraction\n\n**Source:** devpost.com\n**Fetched:** 2026-10-15T13:58:00Z\n\n### Extracted Fields\n\`\`\`json\n{\n  "deadline": "2026-11-18",\n  "prize_pool": "$20,000 USD grand prize + category prizes",\n  "format": "Virtual, async 4 weeks",\n  "team_size": "1-5 members",\n  "eligibility": [\n    "Worldwide, all skill levels",\n    "Claude API required",\n    "1-5 member team",\n    "Demo + GitHub repo"\n  ],\n  "confidence_score": 0.97\n}\n\`\`\``,
    saved: false,
  },
];