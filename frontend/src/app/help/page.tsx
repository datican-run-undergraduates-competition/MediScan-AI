'use client';

import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function Help() {
  const faqItems = [
    {
      question: 'How do I upload a medical scan?',
      answer: 'To upload a medical scan, navigate to the Upload page and select the type of scan you want to analyze. Follow the on-screen instructions to select and upload your file. Supported formats include DICOM, JPEG, and PNG.',
    },
    {
      question: 'What types of scans are supported?',
      answer: 'Our system currently supports X-ray, MRI, CT scans, and ultrasound images. Each type has specific requirements for optimal analysis.',
    },
    {
      question: 'How long does the analysis take?',
      answer: 'Analysis time varies depending on the type and size of the scan. Typically, X-rays take 1-2 minutes, while MRI and CT scans may take 3-5 minutes. You can track the progress in real-time on the dashboard.',
    },
    {
      question: 'How accurate are the results?',
      answer: 'Our AI system has been trained on millions of medical images and achieves high accuracy rates. However, results should always be reviewed by healthcare professionals for final diagnosis.',
    },
    {
      question: 'Can I download my analysis results?',
      answer: 'Yes, you can download your analysis results in PDF format. Navigate to the Results page, select the analysis you want to download, and click the download button.',
    },
    {
      question: 'How do I manage my account settings?',
      answer: 'You can manage your account settings by clicking on your profile icon in the top right corner and selecting "Settings". Here you can update your personal information, notification preferences, and security settings.',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Help Center
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to the AI Medical System Help Center. Here you'll find answers to frequently asked questions and guidance on using our platform.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Frequently Asked Questions
          </Typography>
          {faqItems.map((item, index) => (
            <Accordion key={index}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel${index}-content`}
                id={`panel${index}-header`}
              >
                <Typography variant="subtitle1">{item.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1">{item.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Contact Support
          </Typography>
          <Typography variant="body1" paragraph>
            If you need additional assistance, please contact our support team:
          </Typography>
          <Typography variant="body1">
            Email: support@aimedicalsystem.com
          </Typography>
          <Typography variant="body1">
            Phone: +1 (555) 123-4567
          </Typography>
          <Typography variant="body1">
            Hours: Monday - Friday, 9:00 AM - 5:00 PM EST
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 