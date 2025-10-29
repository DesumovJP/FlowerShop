import Layout from './components/Layout';
import HeroSection from './components/HeroSection';
import FeaturedProducts from './components/FeaturedProducts';
import StorySection from './components/StorySection';
import CategoriesSection from './components/CategoriesSection';
import DiscountSection from './components/DiscountSection';
import SocialSection from './components/SocialSection';

export default function Головна() {
  return (
    <Layout>
      <HeroSection />
      <FeaturedProducts />
      <StorySection />
      <CategoriesSection />
      <DiscountSection />
      <SocialSection />
    </Layout>
  );
}
