import movieData from '@/data/movie-data.json';

// --- Types ---

export interface Movie {
  id: string;
  title: string;
  year: number;
  releaseDate: string;
  studio: string;
  status: 'released' | 'upcoming';
  posterEmoji: string;
  tagline: string;
  description?: string;
  tmdbId?: number | null;
  posterPath?: string | null;
}

export interface Studio {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

// --- Raw data ---

const studios = movieData.studios as Studio[];
const movies = movieData.movies as Movie[];

// --- Indexes (built once) ---

const movieById = new Map<string, Movie>();
for (const m of movies) {
  movieById.set(m.id, m);
}

// --- Accessor functions ---

/** Derive upcoming status dynamically from releaseDate vs today */
export function isUpcoming(movie: Movie): boolean {
  return movie.releaseDate > new Date().toISOString().slice(0, 10);
}

/** All studios */
export function getStudios(): Studio[] {
  return studios;
}

/** All movies */
export function getAllMovies(): Movie[] {
  return movies;
}

/** Single movie by ID */
export function getMovieById(id: string): Movie | undefined {
  return movieById.get(id);
}

/** Movies filtered by studio */
export function getMoviesByStudio(studioId: string): Movie[] {
  return movies.filter(m => m.studio === studioId);
}

/** Upcoming movies sorted by releaseDate ascending */
export function getUpcomingMovies(): Movie[] {
  return movies
    .filter(m => isUpcoming(m))
    .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
}

/** Released movies sorted by year descending */
export function getReleasedMovies(): Movie[] {
  return movies
    .filter(m => !isUpcoming(m))
    .sort((a, b) => b.year - a.year);
}

/** Total number of movies */
export function getTotalMovieCount(): number {
  return movieById.size;
}

/** Build a TMDB poster URL for the given size, or null if no poster */
export function getPosterUrl(movie: Movie, size: 'w154' | 'w185' | 'w500' = 'w500'): string | null {
  if (!movie.posterPath) return null;
  return `https://image.tmdb.org/t/p/${size}${movie.posterPath}`;
}
