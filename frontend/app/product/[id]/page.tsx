import Layout from '../../components/Layout';
import ProductDetail from '../../components/ProductDetail';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <Layout>
      <ProductDetail productId={resolvedParams.id} />
    </Layout>
  );
}
