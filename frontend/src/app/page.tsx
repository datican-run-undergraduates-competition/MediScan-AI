'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  useTheme, 
  alpha,
  Avatar,
  Divider
} from '@mui/material';
import { 
  HealthAndSafety as HealthIcon,
  BiotechOutlined as BiotechIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  SupportAgent as SupportIcon,
  ArrowForward as ArrowIcon,
  AccessTime as TimeIcon,
  Analytics as AnalyticsIcon,
  Hub as HubIcon,
} from '@mui/icons-material';

export default function Home() {
  const theme = useTheme();

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: '90vh',
          display: 'flex',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
          color: 'white',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '-200px', 
            right: '-200px', 
            width: '400px', 
            height: '400px', 
            borderRadius: '50%', 
            background: alpha(theme.palette.primary.light, 0.3),
            filter: 'blur(60px)',
            zIndex: 0,
          }} 
        />
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: '-150px', 
            left: '-150px', 
            width: '300px', 
            height: '300px', 
            borderRadius: '50%', 
            background: alpha(theme.palette.secondary.main, 0.4),
            filter: 'blur(60px)',
            zIndex: 0,
          }} 
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h1" 
                sx={{ 
                  fontWeight: 800, 
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                  mb: 2,
                  background: 'linear-gradient(90deg, #FFFFFF, #E6F0FD)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                }}
              >
                AI-Powered Medical Diagnostics Platform
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 4, 
                  maxWidth: '600px',
                  color: alpha('#fff', 0.9),
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                Revolutionizing healthcare through advanced artificial intelligence. 
                Get accurate diagnostics, analyze medical images, and receive personalized insights.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  size="large"
                  component={Link}
                  href="/register"
                  sx={{ 
                    borderRadius: '50px',
                    px: 4, 
                    py: 1.5,
                    fontSize: '1rem',
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                    background: 'linear-gradient(90deg, #FFFFFF, #F5F9FF)',
                    color: theme.palette.primary.main,
                    '&:hover': {
                      background: '#FFFFFF',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                    }
                  }}
                >
                  Get Started
                </Button>
                
                <Button 
                  variant="outlined" 
                  size="large"
                  component={Link}
                  href="/login"
                  sx={{ 
                    borderRadius: '50px',
                    px: 4, 
                    py: 1.5,
                    fontSize: '1rem',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#FFFFFF',
                    color: '#FFFFFF',
                    '&:hover': {
                      borderColor: '#FFFFFF',
                      background: alpha('#fff', 0.1),
                    }
                  }}
                >
                  Login
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box 
                sx={{ 
                  position: 'relative',
                  width: '100%',
                  height: '500px',
                }}
              >
                <Box
                  component="img"
                  src="/assets/hero-image.png"
                  alt="AI Medical Analysis"
                  sx={{
                    position: 'absolute',
                    width: '120%',
                    height: 'auto',
                    maxWidth: '700px',
                    top: '-50px',
                    right: '-100px',
                    filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.3))',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    width: '300px',
                    height: '200px',
                    top: '50px',
                    left: '0px',
                    background: alpha('#fff', 0.05),
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)',
                    p: 3,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <TimeIcon sx={{ color: theme.palette.secondary.main }} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Real-time Analysis
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: '6px', 
                      background: alpha('#fff', 0.1),
                      borderRadius: '3px',
                      mb: 3,
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: '85%', 
                        height: '6px', 
                        background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
                        borderRadius: '3px',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color={alpha('#fff', 0.7)}>
                    Processing X-Ray analysis with 99.2% accuracy
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 10, position: 'relative' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 700, 
                mb: 2,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                backgroundClip: 'text',
                textFillColor: 'transparent',
              }}
            >
              Comprehensive Medical AI
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                maxWidth: '700px', 
                mx: 'auto',
                mb: 2,
              }}
            >
              Our platform combines cutting-edge AI technology with medical expertise to provide comprehensive healthcare solutions.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                icon: <BiotechIcon fontSize="large" />,
                title: 'Advanced Image Analysis',
                description: 'Analyze CT scans, MRIs, X-rays, and other medical imaging with state-of-the-art AI models.',
              },
              {
                icon: <AnalyticsIcon fontSize="large" />,
                title: 'Data-Driven Insights',
                description: 'Gain valuable insights through comprehensive data analysis and visualizations.',
              },
              {
                icon: <HubIcon fontSize="large" />,
                title: 'Integrated Systems',
                description: 'Seamlessly integrate with existing healthcare systems and workflows.',
              },
              {
                icon: <SpeedIcon fontSize="large" />,
                title: 'Real-time Processing',
                description: 'Get fast results with our optimized processing pipeline for quick diagnosis.',
              },
              {
                icon: <SecurityIcon fontSize="large" />,
                title: 'HIPAA Compliant',
                description: 'Your data is secure with our HIPAA-compliant infrastructure and practices.',
              },
              {
                icon: <SupportIcon fontSize="large" />,
                title: '24/7 Support',
                description: 'Our medical and technical experts are available around the clock to assist you.',
              },
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    borderRadius: '20px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        width: 60,
                        height: 60,
                        mb: 2,
                      }}
                    >
                      {feature.icon}
                    </Avatar>
                    <Typography variant="h5" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {feature.description}
                    </Typography>
                    <Button 
                      endIcon={<ArrowIcon />}
                      sx={{ 
                        textTransform: 'none',
                        fontWeight: 600,
                        p: 0,
                        '&:hover': {
                          background: 'transparent',
                          color: theme.palette.primary.dark,
                        }
                      }}
                    >
                      Learn more
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box 
        sx={{ 
          py: 12, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.15)} 100%)`,
          position: 'relative',
        }}
      >
        <Container maxWidth="md">
          <Box 
            sx={{ 
              textAlign: 'center',
              background: 'white',
              borderRadius: '30px',
              p: { xs: 4, md: 6 },
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box 
              sx={{ 
                position: 'absolute', 
                top: '-150px', 
                right: '-150px', 
                width: '300px', 
                height: '300px', 
                borderRadius: '50%', 
                background: alpha(theme.palette.primary.light, 0.05),
                filter: 'blur(60px)',
              }} 
            />
            
            <HealthIcon 
              sx={{ 
                fontSize: '5rem', 
                color: theme.palette.primary.main,
                mb: 3,
              }} 
            />
            
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                mb: 3,
              }}
            >
              Ready to Transform Your Practice?
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                maxWidth: '600px', 
                mx: 'auto',
                mb: 4,
              }}
            >
              Join thousands of healthcare professionals who are already using our platform to improve patient outcomes.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                size="large"
                component={Link}
                href="/register"
                sx={{ 
                  borderRadius: '50px',
                  px: 5, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  fontWeight: 600,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  '&:hover': {
                    background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                Start Free Trial
              </Button>
              
              <Button 
                variant="outlined" 
                size="large"
                component={Link}
                href="/help"
                sx={{ 
                  borderRadius: '50px',
                  px: 5, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Learn More
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#f8fafc', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HealthIcon sx={{ fontSize: '2rem', color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Ai-Med
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Advanced AI-powered medical diagnostics platform for healthcare professionals.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} Ai-Med. All rights reserved.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Grid container spacing={4}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Product
                  </Typography>
                  <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                    {['Features', 'Pricing', 'Case Studies', 'Testimonials'].map((item) => (
                      <Box component="li" key={item} sx={{ mb: 1 }}>
                        <Link href="#" style={{ textDecoration: 'none', color: 'text.secondary' }}>
                          <Typography variant="body2" color="text.secondary">
                            {item}
                          </Typography>
                        </Link>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Resources
                  </Typography>
                  <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                    {['Blog', 'Documentation', 'Guides', 'API Reference'].map((item) => (
                      <Box component="li" key={item} sx={{ mb: 1 }}>
                        <Link href="#" style={{ textDecoration: 'none', color: 'text.secondary' }}>
                          <Typography variant="body2" color="text.secondary">
                            {item}
                          </Typography>
                        </Link>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Company
                  </Typography>
                  <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                    {['About Us', 'Careers', 'Contact', 'Partners'].map((item) => (
                      <Box component="li" key={item} sx={{ mb: 1 }}>
                        <Link href="#" style={{ textDecoration: 'none', color: 'text.secondary' }}>
                          <Typography variant="body2" color="text.secondary">
                            {item}
                          </Typography>
                        </Link>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Legal
                  </Typography>
                  <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                    {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'HIPAA Compliance'].map((item) => (
                      <Box component="li" key={item} sx={{ mb: 1 }}>
                        <Link href="#" style={{ textDecoration: 'none', color: 'text.secondary' }}>
                          <Typography variant="body2" color="text.secondary">
                            {item}
                          </Typography>
                        </Link>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Ai-Med. All rights reserved.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              {['Facebook', 'Twitter', 'LinkedIn', 'Instagram'].map((social) => (
                <Link key={social} href="#" style={{ textDecoration: 'none', color: 'text.secondary' }}>
                  <Typography variant="body2" color="text.secondary">
                    {social}
                  </Typography>
                </Link>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
} 