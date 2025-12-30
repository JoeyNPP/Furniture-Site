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
  Avatar,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GroupsIcon from "@mui/icons-material/Groups";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import HandshakeIcon from "@mui/icons-material/Handshake";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: <GroupsIcon sx={{ fontSize: 40, color: "#003087" }} />,
      title: "Customer First",
      description:
        "We prioritize your needs and work tirelessly to exceed expectations on every project.",
    },
    {
      icon: <EmojiObjectsIcon sx={{ fontSize: 40, color: "#003087" }} />,
      title: "Quality Focus",
      description:
        "We carefully select only the highest quality furniture from our liquidation sources.",
    },
    {
      icon: <HandshakeIcon sx={{ fontSize: 40, color: "#003087" }} />,
      title: "Integrity",
      description:
        "Honest pricing, transparent processes, and genuine care for our clients' success.",
    },
  ];

  const whyChooseUs = [
    "Premium brands at wholesale prices",
    "Full-service delivery and installation",
    "Expert space planning and design",
    "Flexible financing options available",
    "Sustainable and eco-friendly options",
    "Dedicated project managers",
    "Quick turnaround times",
    "Comprehensive warranty coverage",
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
              About Us
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              Creating Workspaces That Inspire
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              For over two decades, NPP Office Furniture has been helping
              businesses transform their workspaces with quality furniture at
              unbeatable prices.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Our Story */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  bgcolor: "#f8f9fa",
                  borderRadius: 4,
                  p: 4,
                  height: 400,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #eee",
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h1"
                    sx={{ fontWeight: 800, color: "#003087", opacity: 0.2 }}
                  >
                    25+
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: -2 }}>
                    Years of Excellence
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography
                variant="overline"
                sx={{ color: "#003087", fontWeight: 600, letterSpacing: 2 }}
              >
                Our Story
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, mb: 3, color: "#1a1a1a" }}
              >
                Built on Quality and Trust
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", mb: 3, lineHeight: 1.8 }}
              >
                NPP Office Furniture was founded with a simple mission: to
                provide businesses with high-quality office furniture at prices
                that make sense. We saw an opportunity to connect companies
                looking to upgrade their workspaces with premium furniture from
                liquidations and closeouts.
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", mb: 3, lineHeight: 1.8 }}
              >
                Today, we've grown into a full-service office furniture
                provider, offering everything from space planning and design to
                delivery, installation, and ongoing support. Our team of
                experienced professionals is dedicated to making your furniture
                project seamless from start to finish.
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", lineHeight: 1.8 }}
              >
                We believe that every business deserves a workspace that
                inspires productivity and attracts top talent - without
                breaking the bank.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Our Values */}
      <Box sx={{ py: 10, bgcolor: "#f8f9fa" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography
              variant="overline"
              sx={{ color: "#003087", fontWeight: 600, letterSpacing: 2 }}
            >
              Our Values
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
              What Drives Us
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {values.map((value, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    textAlign: "center",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    border: "1px solid #eee",
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Avatar
                      sx={{
                        bgcolor: "rgba(0,48,135,0.1)",
                        width: 80,
                        height: 80,
                        mx: "auto",
                        mb: 3,
                      }}
                    >
                      {value.icon}
                    </Avatar>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, mb: 2, color: "#1a1a1a" }}
                    >
                      {value.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: "text.secondary" }}>
                      {value.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Why Choose Us */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="overline"
                sx={{ color: "#003087", fontWeight: 600, letterSpacing: 2 }}
              >
                Why Choose Us
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, mb: 4, color: "#1a1a1a" }}
              >
                The NPP Advantage
              </Typography>
              <Grid container spacing={2}>
                {whyChooseUs.map((item, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CheckCircleIcon sx={{ color: "#003087" }} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {item}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  bgcolor: "#003087",
                  borderRadius: 4,
                  p: 5,
                  color: "white",
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                  Our Mission
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ opacity: 0.9, lineHeight: 1.8, mb: 3 }}
                >
                  To create inviting office spaces that attract and retain
                  talent, meet our clients' budgets and timelines, and exceed
                  their expectations. We strive to make an environment that we
                  would want to work in and achieve the same for our clients.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate("/contact")}
                  sx={{
                    bgcolor: "#FFD700",
                    color: "#003087",
                    fontWeight: 700,
                    "&:hover": { bgcolor: "#FFC000" },
                  }}
                >
                  Get Started Today
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 8,
          background: "linear-gradient(135deg, #003087 0%, #001a4d 100%)",
          color: "white",
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Ready to Work With Us?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
              Let us help you create the perfect workspace for your team.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/catalog")}
                sx={{
                  bgcolor: "#FFD700",
                  color: "#003087",
                  fontWeight: 700,
                  px: 4,
                  "&:hover": { bgcolor: "#FFC000" },
                }}
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
                  "&:hover": { borderColor: "#FFD700", color: "#FFD700" },
                }}
              >
                Contact Us
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <PublicFooter />
    </Box>
  );
};

export default About;
