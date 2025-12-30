import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SendIcon from "@mui/icons-material/Send";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    inquiryType: "",
    message: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const inquiryTypes = [
    "General Inquiry",
    "Request a Quote",
    "Space Planning Consultation",
    "Delivery & Installation",
    "Furniture Liquidation",
    "Project Management",
    "Other",
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send the form data to a backend
    console.log("Form submitted:", formData);
    setSnackbar({
      open: true,
      message:
        "Thank you for your inquiry! We will get back to you within 24 hours.",
      severity: "success",
    });
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      inquiryType: "",
      message: "",
    });
  };

  const contactInfo = [
    {
      icon: <EmailIcon sx={{ fontSize: 28, color: "#003087" }} />,
      title: "Email",
      details: ["info@nppfurniture.com", "sales@nppfurniture.com"],
    },
    {
      icon: <PhoneIcon sx={{ fontSize: 28, color: "#003087" }} />,
      title: "Phone",
      details: ["(555) 123-4567", "(555) 123-4568"],
    },
    {
      icon: <LocationOnIcon sx={{ fontSize: 28, color: "#003087" }} />,
      title: "Address",
      details: ["123 Furniture Lane", "Boston, MA 02101"],
    },
    {
      icon: <AccessTimeIcon sx={{ fontSize: 28, color: "#003087" }} />,
      title: "Business Hours",
      details: ["Mon - Fri: 8:00 AM - 5:00 PM", "Sat: By Appointment"],
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
              Contact Us
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              Let's Start a Conversation
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Have questions about our furniture or services? We'd love to hear
              from you. Reach out and our team will respond within 24 hours.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Contact Form & Info Section */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            {/* Contact Form */}
            <Grid item xs={12} md={7}>
              <Card
                sx={{
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  border: "1px solid #eee",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, mb: 1, color: "#1a1a1a" }}
                  >
                    Send Us a Message
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: "text.secondary", mb: 4 }}
                  >
                    Fill out the form below and we'll get back to you as soon as
                    possible.
                  </Typography>

                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Your Name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          autoComplete="off"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email Address"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          autoComplete="off"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          autoComplete="off"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Company Name"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          autoComplete="off"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          select
                          label="Inquiry Type"
                          name="inquiryType"
                          value={formData.inquiryType}
                          onChange={handleChange}
                          required
                        >
                          {inquiryTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Your Message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          multiline
                          rows={5}
                          required
                          placeholder="Tell us about your project, requirements, or any questions you have..."
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          fullWidth
                          endIcon={<SendIcon />}
                          sx={{
                            bgcolor: "#003087",
                            py: 1.5,
                            fontWeight: 600,
                            fontSize: "1.1rem",
                            "&:hover": { bgcolor: "#002266" },
                          }}
                        >
                          Send Message
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
              </Card>
            </Grid>

            {/* Contact Info */}
            <Grid item xs={12} md={5}>
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, mb: 1, color: "#1a1a1a" }}
                >
                  Get in Touch
                </Typography>
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  We're here to help with all your office furniture needs.
                </Typography>
              </Box>

              <Stack spacing={3}>
                {contactInfo.map((info, index) => (
                  <Card
                    key={index}
                    sx={{
                      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                      border: "1px solid #eee",
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box
                          sx={{
                            bgcolor: "rgba(0,48,135,0.08)",
                            borderRadius: 2,
                            p: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {info.icon}
                        </Box>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, mb: 0.5, color: "#1a1a1a" }}
                          >
                            {info.title}
                          </Typography>
                          {info.details.map((detail, idx) => (
                            <Typography
                              key={idx}
                              variant="body2"
                              sx={{ color: "text.secondary" }}
                            >
                              {detail}
                            </Typography>
                          ))}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>

              {/* Quick Links */}
              <Box
                sx={{
                  mt: 4,
                  p: 3,
                  bgcolor: "#003087",
                  borderRadius: 2,
                  color: "white",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Looking for Something Specific?
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                  For liquidation inquiries, please include photos and
                  quantities of items to be removed, the date furniture must be
                  removed, and your address.
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  <strong>Liquidation inquiries:</strong>
                  <br />
                  liquidations@nppfurniture.com
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Map Section (Placeholder) */}
      <Box sx={{ bgcolor: "#f8f9fa", py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
              Visit Our Showroom
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Come see our inventory in person. Appointments recommended for
              personalized service.
            </Typography>
          </Box>
          <Box
            sx={{
              height: 300,
              bgcolor: "#ddd",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #ccc",
            }}
          >
            <Typography variant="h6" sx={{ color: "#666" }}>
              Map Placeholder - 123 Furniture Lane, Boston, MA 02101
            </Typography>
          </Box>
        </Container>
      </Box>

      <PublicFooter />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Contact;
