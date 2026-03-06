/**
 * One-time script to populate movie-data.json with TMDB data.
 *
 * Usage:
 *   TMDB_API_KEY=xxx npx ts-node scripts/seed-tmdb-data.ts
 *
 * What it does:
 *   1. Reads data/movie-data.json
 *   2. For each movie, searches TMDB by title + year
 *   3. Writes back tmdbId, posterPath, and description (from TMDB overview)
 *   4. Saves the updated JSON in-place
 *
 * Re-running is safe — it skips movies that already have a tmdbId.
 */

import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.TMDB_API_KEY;
if (!API_KEY) {
  console.error('Error: TMDB_API_KEY env var is required.');
  console.error('Usage: TMDB_API_KEY=xxx npx ts-node scripts/seed-tmdb-data.ts');
  process.exit(1);
}

const DATA_PATH = path.resolve(__dirname, '../data/movie-data.json');
const TMDB_BASE = 'https://api.themoviedb.org/3';

interface MovieEntry {
  id: string;
  title: string;
  year: number;
  releaseDate: string;
  studio: string;
  status: string;
  posterEmoji: string;
  tagline: string;
  description?: string;
  tmdbId?: number | null;
  posterPath?: string | null;
}

interface TMDBSearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
}

async function searchMovie(title: string, year: number): Promise<TMDBSearchResult | null> {
  const params = new URLSearchParams({
    api_key: API_KEY!,
    query: title,
    year: String(year),
  });

  const res = await fetch(`${TMDB_BASE}/search/movie?${params}`);
  if (!res.ok) {
    console.warn(`  TMDB search failed for "${title}" (${year}): ${res.status}`);
    return null;
  }

  const data = await res.json();
  const results: TMDBSearchResult[] = data.results ?? [];

  if (results.length === 0) {
    // Retry without year constraint
    const params2 = new URLSearchParams({
      api_key: API_KEY!,
      query: title,
    });
    const res2 = await fetch(`${TMDB_BASE}/search/movie?${params2}`);
    if (!res2.ok) return null;
    const data2 = await res2.json();
    return data2.results?.[0] ?? null;
  }

  return results[0];
}

async function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const data = JSON.parse(raw);
  const movies: MovieEntry[] = data.movies;

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const movie of movies) {
    if (movie.tmdbId != null) {
      skipped++;
      continue;
    }

    // Rate-limit: ~250ms between requests
    await new Promise(r => setTimeout(r, 250));

    const result = await searchMovie(movie.title, movie.year);
    if (!result) {
      console.warn(`  No TMDB result for: ${movie.title} (${movie.year})`);
      movie.tmdbId = null;
      movie.posterPath = null;
      failed++;
      continue;
    }

    movie.tmdbId = result.id;
    movie.posterPath = result.poster_path;
    if (!movie.description && result.overview) {
      movie.description = result.overview;
    }

    console.log(`  ✓ ${movie.title} → TMDB #${result.id}`);
    updated++;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n');

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
