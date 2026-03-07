import type { Metadata } from 'next';
import { getVenueById, slugToShip, getCategories } from '@/lib/unified-data';
import { getVenueAggregateRating } from '@/lib/review-aggregates';

interface Props {
  params: Promise<{ venueId: string; shipSlug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ venueId: string; shipSlug: string }> }): Promise<Metadata> {
  const { venueId, shipSlug } = await params;
  const venue = getVenueById(venueId);
  const ship = slugToShip(shipSlug);
  if (!venue || !ship) return { title: 'Venue Not Found' };

  const categories = getCategories();
  const categoryLabel = categories[venue.category]?.label || venue.category;

  return {
    title: `${venue.name} on ${ship} - ${categoryLabel}`,
    description: `${venue.name} on ${ship}. ${venue.description.slice(0, 140)}`,
    openGraph: {
      title: `${venue.name} on ${ship}`,
      description: `${venue.name} on ${ship}. ${venue.description.slice(0, 140)}`,
    },
  };
}

export default async function VenueShipLayout({ params, children }: Props) {
  const { venueId, shipSlug } = await params;
  const venue = getVenueById(venueId);
  const ship = slugToShip(shipSlug);
  if (!venue || !ship) return <>{children}</>;

  const aggregate = await getVenueAggregateRating(venueId, ship);

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', position: 1, name: 'Cruise Guide', item: 'https://www.disneytrivia.club/Secret-menU' },
      { '@type': 'ListItem', position: 2, name: 'Venues', item: 'https://www.disneytrivia.club/Secret-menU/venues' },
      { '@type': 'ListItem', position: 3, name: venue.name, item: `https://www.disneytrivia.club/venues/${venueId}` },
      { '@type': 'ListItem', position: 4, name: ship },
    ],
  };

  const jsonLd: object[] = [breadcrumb];

  if (aggregate.totalReviews > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': `${venue.name} - ${ship}`,
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
