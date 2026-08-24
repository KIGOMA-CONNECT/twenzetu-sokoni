import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'afriMarket';

export function PageTitle({ title }: { title: string }) {
  return (
    <Helmet>
      <title>{title ? `${title} | ${SITE_NAME}` : SITE_NAME}</title>
    </Helmet>
  );
}
