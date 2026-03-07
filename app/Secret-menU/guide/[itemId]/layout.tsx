import type { Metadata } from 'next';
import { getCruiseGuideItem, getCruiseGuideCategories } from '@/lib/cruise-guide-data';
import { getGuideItemAggregateRating } from '@/lib/review-aggregates';

interface Props {
  params: Promise<{ itemId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ itemId: string }> }): Promise<Metadata> {
  const { itemId } = await params;
  const item = getCruiseGuideItem(itemId);
  if (!item) return { title: 'Guide Item Not Found' };

  const cats = getCruiseGuideCategories();
  const catLabels = item.categories
    .map(c => cats.find(gc => gc.key === c)?.label)
    .filter(Boolean)
    .join(', ');
  const shipList = item.ships.join(', ');

  return {
    title: `${item.name} - ${catLabels || 'Cruise Guide'}`,
    description: `${item.description.slice(0, 140)} Available on ${shipList}.`,
    openGraph: {
      title: `${item.name} - Disney Cruise Line`,
      description: `${item.description.slice(0, 140)} Available on ${shipList}.`,
    },
  };
}

export default async function GuideItemLayout({ params, children }: Props) {
  const { itemId } = await params;
  const item = getCruiseGuideItem(itemId);
  if (!item) return <>{children}</>;

  const aggregate = await getGuideItemAggregateRating(item.plannerItemType, item.sourceId);

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', position: 1, name: 'Cruise Guide', item: 'https://www.disneytrivia.club/Secret-menU' },
      { '@type': 'ListItem', position: 2, name: 'Guide', item: 'https://www.disneytrivia.club/Secret-menU/cruise-guide' },
      { '@type': 'ListItem', position: 3, name: item.name },
    ],
  };

  const jsonLd: object[] = [breadcrumb];

  if (aggregate.totalReviews > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'TouristAttraction',
      'name': item.name,
      'description': item.description,
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
