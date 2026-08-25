import React from 'react';

interface StructuredDataProps {
  type: 'Organization' | 'Product' | 'WebSite' | 'BreadcrumbList';
  data?: Record<string, unknown>;
}

const defaultOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'afriMarket',
  url: 'https://twenzetusokoni.com',
  logo: 'https://twenzetusokoni.com/logo.png',
  description: "Tanzania's largest online marketplace",
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'TZ',
  },
  sameAs: [],
};

const defaultWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'afriMarket',
  url: 'https://twenzetusokoni.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://twenzetusokoni.com/products?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  let schema;
  switch (type) {
    case 'Organization':
      schema = { ...defaultOrganization, ...data };
      break;
    case 'WebSite':
      schema = { ...defaultWebSite, ...data };
      break;
    default:
      schema = data || {};
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
