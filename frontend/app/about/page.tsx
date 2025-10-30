import Layout from '../components/Layout';
import AboutContent from '../components/AboutContent';
import { Fade, Box } from '@mui/material';

export default function AboutPage() {
  return (
    <Layout>
      <Fade in appear timeout={900}>
        <Box>
          <AboutContent />
        </Box>
      </Fade>
    </Layout>
  );
}