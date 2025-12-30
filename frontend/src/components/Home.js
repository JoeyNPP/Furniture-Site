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
} from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import RecyclingIcon from "@mui/icons-material/Recycling";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import BuildIcon from "@mui/icons-material/Build";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";

const Home = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: <InventoryIcon sx={{ fontSize: 48, color: "#003087" }} />,
      title: "Quality Inventory",
      description:
        "All furniture is carefully selected from liquidations to bring you only the highest quality products at unbeatable prices.",
    },
    {
      icon: <DesignServicesIcon sx={{ fontSize: 48, color: "#003087" }} />,
      title: "Space Planning",
      description:
        "Our design consultants help you maximize your office space with professional layout and design services.",
    },
    {
      icon: <LocalShippingIcon sx={{ fontSize: 48, color: "#003087" }} />,
      title: "Delivery & Installation",
      description:
        "Full-service delivery and professional installation to get your office up and running quickly.",
    },
    {
      icon: <RecyclingIcon sx={{ fontSize: 48, color: "#003087" }} />,
      title: "Liquidation Services",
      description:
        "Need to clear out old furniture? We offer fair prices and handle all disassembly and removal.",
    },
    {
      icon: <BuildIcon sx={{ fontSize: 48, color: "#003087" }} />,
      title: "Reconfiguration",
      description:
        "Repurpose your existing furniture with our expert reconfiguration and modification services.",
    },
    {
      icon: <SupportAgentIcon sx={{ fontSize: 48, color: "#003087" }} />,
      title: "Project Management",
      description:
        "From start to finish, our team manages your entire office furniture project seamlessly.",
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
          py: { xs: 8, md: 12 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "50%",
            height: "100%",
            opacity: 0.1,
            backgroundImage:
              "url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                  lineHeight: 1.2,
                }}
              >
                Quality Office Furniture
                <br />
                <span style={{ color: "#FFD700" }}>At Unbeatable Prices</span>
              </Typography>
              <Typography
                variant="h6"
                sx={{ mb: 4, opacity: 0.9, fontWeight: 400, lineHeight: 1.6 }}
              >
                We specialize in new and pre-owned office furniture from top
                brands like Herman Miller, Steelcase, and Haworth. From
                workstations to executive suites, we help businesses create
                inviting spaces that attract and retain talent.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/catalog")}
                  sx={{
                    bgcolor: "#FFD700",
                    color: "#003087",
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    fontSize: "1.1rem",
                    "&:hover": { bgcolor: "#FFC000" },
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Browse Catalog
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/contact")}
                  sx={{
                    borderColor: "white",
                    color: "white",
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    "&:hover": { borderColor: "#FFD700", color: "#FFD700" },
                  }}
                >
                  Get a Quote
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Trust Indicators */}
      <Box sx={{ bgcolor: "#f8f9fa", py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {[
              { value: "500+", label: "Happy Clients" },
              { value: "10,000+", label: "Items in Stock" },
              { value: "25+", label: "Years Experience" },
              { value: "100%", label: "Satisfaction Guarantee" },
            ].map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, color: "#003087" }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: "text.secondary", fontWeight: 500 }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Services Section */}
      <Box sx={{ py: 10, bgcolor: "white" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography
              variant="overline"
              sx={{ color: "#003087", fontWeight: 600, letterSpacing: 2 }}
            >
              What We Offer
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontWeight: 700, color: "#1a1a1a", mb: 2 }}
            >
              Complete Office Solutions
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "text.secondary", maxWidth: 600, mx: "auto" }}
            >
              We handle every aspect of your office furniture needs, from
              planning to installation and beyond.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {services.map((service, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    border: "1px solid #eee",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 12px 40px rgba(0,48,135,0.15)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: "center" }}>
                    <Box sx={{ mb: 2 }}>{service.icon}</Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, mb: 1.5, color: "#1a1a1a" }}
                    >
                      {service.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {service.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: "center", mt: 6 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/services")}
              sx={{
                borderColor: "#003087",
                color: "#003087",
                fontWeight: 600,
                px: 4,
                "&:hover": { bgcolor: "#003087", color: "white" },
              }}
              endIcon={<ArrowForwardIcon />}
            >
              View All Services
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Featured Brands */}
      <Box sx={{ py: 8, bgcolor: "#f8f9fa" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h5"
            sx={{ textAlign: "center", mb: 4, fontWeight: 600, color: "#666" }}
          >
            Featuring Top Brands
          </Typography>
          <Stack
            direction="row"
            spacing={6}
            justifyContent="center"
            flexWrap="wrap"
            sx={{ opacity: 0.7 }}
          >
            {[
              "Herman Miller",
              "Steelcase",
              "Haworth",
              "Teknion",
              "Allsteel",
              "AIS",
            ].map((brand) => (
              <Typography
                key={brand}
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#333",
                  letterSpacing: 1,
                  my: 1,
                }}
              >
                {brand}
              </Typography>
            ))}
          </Stack>
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
              Ready to Transform Your Workspace?
            </Typography>
            <Typography
              variant="h6"
              sx={{ mb: 4, opacity: 0.9, fontWeight: 400 }}
            >
              Contact us today for a free consultation and quote. We'll help
              you find the perfect furniture solution for your budget and
              timeline.
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
                Contact Us
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
                Browse Inventory
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <PublicFooter />
    </Box>
  );
};

export default Home;
