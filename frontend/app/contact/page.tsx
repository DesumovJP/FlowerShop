import Layout from '../components/Layout';
import ContactContent from '../components/ContactContent';
import { Fade, Box } from '@mui/material';

export default function ContactPage() {
  return (
    <Layout>
      <Fade in appear timeout={900}>
        <Box>
          <ContactContent />
        </Box>
      </Fade>
    </Layout>
  );
}
