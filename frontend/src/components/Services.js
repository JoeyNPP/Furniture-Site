import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider,
} from "@mui/material";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RecyclingIcon from "@mui/icons-material/Recycling";
import BuildIcon from "@mui/icons-material/Build";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import MoveUpIcon from "@mui/icons-material/MoveUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";

const Services = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: <DesignServicesIcon sx={{ fontSize: 56, color: "#003087" }} />,
      title: "Space Planning & Design",
      description:
        "Our expert design consultants work with you to create the perfect office layout. We maximize your space efficiency while creating an environment that promotes productivity and collaboration.",
      features: [
        "Free initial consultation",
        "2D and 3D floor plan designs",
        "Ergonomic workspace solutions",
        "Brand-aligned design aesthetics",
        "Capacity and flow optimization",
      ],
    },
    {
      icon: <LocalShippingIcon sx={{ fontSize: 56, color: "#003087" }} />,
      title: "Delivery & Installation",
      description:
        "Full-service delivery and professional installation to get your office up and running quickly. Our trained technicians handle everything from unpacking to final adjustments.",
      features: [
        "White-glove delivery service",
        "Professional assembly",
        "Furniture placement per plan",
        "Packaging removal and recycling",
        "Final walkthrough and adjustments",
      ],
    },
    {
      icon: <RecyclingIcon sx={{ fontSize: 56, color: "#003087" }} />,
      title: "Furniture Liquidation",
      description:
        "Need to clear out old furniture? We offer fair prices for quality used furniture and handle all aspects of removal. Our streamlined process makes it easy for businesses transitioning or downsizing.",
      features: [
        "Free on-site assessment",
        "Fair market value offers",
        "Complete disassembly included",
        "Flexible scheduling options",
        "Environmentally responsible disposal",
      ],
    },
    {
      icon: <BuildIcon sx={{ fontSize: 56, color: "#003087" }} />,
      title: "Reconfiguration Services",
      description:
        "Repurpose your existing furniture with our expert reconfiguration services. We can modify, refinish, or reconfigure your current pieces to meet new requirements and extend their life.",
      features: [
        "Workstation modifications",
        "Panel reconfiguration",
        "Surface refinishing",
        "Component replacement",
        "Layout adjustments",
      ],
    },
    {
      icon: <SupportAgentIcon sx={{ fontSize: 56, color: "#003087" }} />,
      title: "Project Management",
      description:
        "From start to finish, our dedicated project managers oversee every aspect of your furniture project. We coordinate timelines, vendors, and installations to ensure a seamless experience.",
      features: [
        "Single point of contact",
        "Detailed project timelines",
        "Vendor coordination",
        "Budget management",
        "Post-installation support",
      ],
    },
    {
      icon: <MoveUpIcon sx={{ fontSize: 56, color: "#003087" }} />,
      title: "Move Management",
      description:
        "Relocating your office? Our move management services ensure a smooth transition with minimal disruption to your business operations. We handle the logistics so you can focus on your work.",
      features: [
        "Pre-move planning",
        "Furniture inventory management",
        "Coordinated relocation",
        "Set-up at new location",
        "Post-move organization",
      ],
    },
  ];

  return (
    <Box>
      <PublicNavbar />

      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #003087 0%, #001a4d 100%)",
          color: "white",
          py: { xs: 8, md: 10 },
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", maxWidth: 800, mx: "auto" }}>
            <Typography
              variant="overline"
              sx={{ letterSpacing: 3, opacity: 0.8 }}
            >
              Our Services
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              Complete Office Furniture Solutions
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              From design to delivery, liquidation to reconfiguration - we
              handle every aspect of your office furniture needs with
              professionalism and care.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Services Grid */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {services.map((service, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    border: "1px solid #eee",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 40px rgba(0,48,135,0.12)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={3} alignItems="flex-start">
                      <Box
                        sx={{
                          bgcolor: "rgba(0,48,135,0.08)",
                          borderRadius: 2,
                          p: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {service.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h5"
                          sx={{ fontWeight: 700, mb: 2, color: "#1a1a1a" }}
                        >
                          {service.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: "text.secondary", mb: 3, lineHeight: 1.7 }}
                        >
                          {service.description}
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Stack spacing={1}>
                          {service.features.map((feature, idx) => (
                            <Stack
                              key={idx}
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <CheckCircleIcon
                                sx={{ color: "#003087", fontSize: 18 }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {feature}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Process Section */}
      <Box sx={{ py: 10, bgcolor: "#f8f9fa" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography
              variant="overline"
              sx={{ color: "#003087", fontWeight: 600, letterSpacing: 2 }}
            >
              How It Works
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
              Our Simple Process
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {[
              {
                step: "01",
                title: "Consultation",
                description:
                  "Contact us to discuss your needs. We'll learn about your space, budget, and timeline.",
              },
              {
                step: "02",
                title: "Planning",
                description:
                  "Our team creates a customized plan with furniture recommendations and layout options.",
              },
              {
                step: "03",
                title: "Selection",
                description:
                  "Browse our inventory and select pieces that match your style and functional requirements.",
              },
              {
                step: "04",
                title: "Delivery",
                description:
                  "We handle delivery, installation, and setup - leaving you with a ready-to-use workspace.",
              },
            ].map((item, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      color: "#003087",
                      opacity: 0.2,
                      mb: -2,
                    }}
                  >
                    {item.step}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 1, color: "#1a1a1a" }}
                  >
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {item.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 10,
          background: "linear-gradient(135deg, #003087 0%, #001a4d 100%)",
          color: "white",
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
              Ready to Get Started?
            </Typography>
            <Typography
              variant="h6"
              sx={{ mb: 4, opacity: 0.9, fontWeight: 400 }}
            >
              Contact us today for a free consultation. We'll help you find the
              perfect solution for your office furniture needs.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/contact")}
                sx={{
                  bgcolor: "#FFD700",
                  color: "#003087",
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  "&:hover": { bgcolor: "#FFC000" },
                }}
              >
                Request a Quote
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/catalog")}
                sx={{
                  borderColor: "white",
                  color: "white",
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  "&:hover": { borderColor: "#FFD700", color: "#FFD700" },
                }}
              >
                Browse Catalog
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <PublicFooter />
    </Box>
  );
};

export default Services;
