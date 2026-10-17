import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { runSearch } from './search.js';
import type { SearchQuery } from './search.js';

const app = Fastify();

await app.register(cors, { origin: true });

app.get('/health', async () => {
  return { status: 'ok', message: 'Vanguard backend is running' };
});

app.post('/api/search', async (request, reply) => {
  const body = request.body as Partial<SearchQuery>;

  const query: SearchQuery = {
    degree: body.degree ?? '',
    skills: body.skills ?? [],
    categories: body.categories?.length ? body.categories : ['Scholarship', 'Internship', 'Hackathon'],
    rawText: body.rawText ?? '',
  };

  try {
    return await runSearch(query);
  } catch (err) {
    console.error('Search failed:', err);
    return reply.status(500).send({ error: 'Search failed. Please try again.' });
  }
});

await app.listen({ port: 3000 });
console.log('Server running at http://localhost:3000');