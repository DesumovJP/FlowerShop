import { Suspense } from 'react';
import Layout from '../components/Layout';
import CatalogContent from '../components/CatalogContent';

export default function CatalogPage() {
  return (
    <Layout>
      <Suspense fallback={<div>Завантаження...</div>}>
        <CatalogContent />
      </Suspense>
    </Layout>
  );
}
