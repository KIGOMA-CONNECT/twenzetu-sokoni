import React from 'react';
import { Helmet } from 'react-helmet-async';

interface PageTitleProps {
  title: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({
  title,
  description = 'afriMarket - Your local marketplace for fresh produce, services, and more',
  ogImage = '/og-image.png',
  ogType = 'website',
  canonical
}) => {
  const fullTitle = title ? `${title} | afriMarket` : 'afriMarket';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
};
