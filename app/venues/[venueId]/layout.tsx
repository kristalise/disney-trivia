import type { Metadata } from 'next';
import { getVenueById, getCategories } from '@/lib/unified-data';
import { getVenueAggregateRating } from '@/lib/review-aggregates';

interface Props {
  params: Promise<{ venueId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ venueId: string }> }): Promise<Metadata> {
  const { venueId } = await params;
  const venue = getVenueById(venueId);
  if (!venue) return { title: 'Venue Not Found' };

  const categories = getCategories();
  const categoryLabel = categories[venue.category]?.label || venue.category;
  const ships = venue.shipInstances.filter(si => si.current).map(si => si.ship);
  const shipList = ships.length > 0 ? ships.join(', ') : 'Disney Cruise Line';

  return {
    title: `${venue.name} - ${categoryLabel} on ${shipList}`,
    description: venue.description.slice(0, 160),
    openGraph: {
      title: `${venue.name} - ${categoryLabel}`,
      description: venue.description.slice(0, 160),
    },
  };
}

export default async function VenueLayout({ params, children }: Props) {
  const { venueId } = await params;
  const venue = getVenueById(venueId);
  if (!venue) return <>{children}</>;

  const categories = getCategories();
  const categoryLabel = categories[venue.category]?.label || venue.category;
  const aggregate = await getVenueAggregateRating(venueId);

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', position: 1, name: 'Cruise Guide', item: 'https://www.disneytrivia.club/Secret-menU' },
      { '@type': 'ListItem', position: 2, name: 'Venues', item: 'https://www.disneytrivia.club/Secret-menU/venues' },
      { '@type': 'ListItem', position: 3, name: venue.name },
    ],
  };

  const jsonLd: object[] = [breadcrumb];

  if (aggregate.totalReviews > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': venue.name,
      'description': venue.description,
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': aggregate.averageRating,
        'bestRating': 5,
        'worstRating': 1,
        'ratingCount': aggregate.totalReviews,
      },
    });
  }

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
