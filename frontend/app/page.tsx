import Layout from './components/Layout';
import HeroSection from './components/HeroSection';
import FeaturedProducts from './components/FeaturedProducts';
import StorySection from './components/StorySection';
import CategoriesSection from './components/CategoriesSection';
import DiscountSection from './components/DiscountSection';
import SocialSection from './components/SocialSection';
import { Fade, Box } from '@mui/material';

export default function Головна() {
  return (
    <Layout>
      <Fade in appear timeout={700}>
        <Box>
          <HeroSection />
        </Box>
      </Fade>
      <Fade in appear timeout={900}>
        <Box>
          <FeaturedProducts />
        </Box>
      </Fade>
      <Fade in appear timeout={1100}>
        <Box>
          <StorySection />
        </Box>
      </Fade>
      <Fade in appear timeout={1300}>
        <Box>
          <CategoriesSection />
        </Box>
      </Fade>
      <Fade in appear timeout={1500}>
        <Box>
          <DiscountSection />
        </Box>
      </Fade>
      <Fade in appear timeout={1700}>
        <Box>
          <SocialSection />
        </Box>
      </Fade>
    </Layout>
  );
}
