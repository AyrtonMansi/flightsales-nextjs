import PageShell from '@/components/PageShell';

export const metadata = {
  title: 'Partners — FlightSales.com.au',
  description:
    'FlightSales partners — finance, insurance, escrow, maintenance, training, ' +
    'inspection and transport providers we work with to make buying an aircraft simpler.',
};

export const revalidate = 300;

export default function PartnersRoute() {
  return <PageShell initialPage="partners" />;
}
