import type { Metadata } from 'next';
import { getMovieById, getStudios, getPosterUrl } from '@/lib/movie-data';
import { getMovieAggregateRating } from '@/lib/review-aggregates';

interface Props {
  params: Promise<{ movieId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ movieId: string }> }): Promise<Metadata> {
  const { movieId } = await params;
  const movie = getMovieById(movieId);
  if (!movie) return { title: 'Movie Not Found' };

  const studios = getStudios();
  const studio = studios.find(s => s.id === movie.studio);
  const posterUrl = getPosterUrl(movie, 'w500');

  return {
    title: `${movie.title} (${movie.year}) - ${studio?.label || 'Disney'}`,
    description: movie.description || movie.tagline,
    openGraph: {
      title: `${movie.title} (${movie.year})`,
      description: movie.description || movie.tagline,
      ...(posterUrl ? { images: [{ url: posterUrl, alt: movie.title }] } : {}),
    },
  };
}

export default async function MovieLayout({ params, children }: Props) {
  const { movieId } = await params;
  const movie = getMovieById(movieId);
  if (!movie) return <>{children}</>;

  const studios = getStudios();
  const studio = studios.find(s => s.id === movie.studio);
  const aggregate = await getMovieAggregateRating(movieId);

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', position: 1, name: 'Cruise Guide', item: 'https://www.disneytrivia.club/Secret-menU' },
      { '@type': 'ListItem', position: 2, name: 'Movies', item: 'https://www.disneytrivia.club/Secret-menU/movies' },
      { '@type': 'ListItem', position: 3, name: movie.title },
    ],
  };

  const jsonLd: object[] = [breadcrumb];

  const movieLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    'name': movie.title,
    'datePublished': movie.releaseDate,
    'description': movie.description || movie.tagline,
    'productionCompany': {
      '@type': 'Organization',
      'name': studio?.label || 'Disney',
    },
  };

  if (aggregate.totalReviews > 0) {
    movieLd.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': aggregate.averageRating,
      'bestRating': 5,
      'worstRating': 1,
      'ratingCount': aggregate.totalReviews,
    };
  }

  jsonLd.push(movieLd);

  return (
    <>
      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
      {children}
    </>
  );
}
