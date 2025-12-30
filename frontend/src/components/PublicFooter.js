import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Typography, Grid, Stack, IconButton } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";

const PublicFooter = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: "#1a1a1a", color: "white", py: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              NPP Office Furniture
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 2, lineHeight: 1.8 }}>
              Your trusted partner for quality new and pre-owned office
              furniture. We help businesses create inviting workspaces that
              attract and retain talent.
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton
                sx={{
                  color: "white",
                  opacity: 0.7,
                  "&:hover": { opacity: 1, color: "#FFD700" },
                }}
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                sx={{
                  color: "white",
                  opacity: 0.7,
                  "&:hover": { opacity: 1, color: "#FFD700" },
                }}
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                sx={{
                  color: "white",
                  opacity: 0.7,
                  "&:hover": { opacity: 1, color: "#FFD700" },
                }}
              >
                <InstagramIcon />
              </IconButton>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Quick Links
            </Typography>
            <Stack spacing={1}>
              {["Home", "About", "Services", "Catalog", "Contact"].map(
                (link) => (
                  <Typography
                    key={link}
                    variant="body2"
                    sx={{
                      opacity: 0.7,
                      cursor: "pointer",
                      "&:hover": { opacity: 1, color: "#FFD700" },
                    }}
                    onClick={() =>
                      navigate(link === "Home" ? "/" : `/${link.toLowerCase()}`)
                    }
                  >
                    {link}
                  </Typography>
                )
              )}
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Services
            </Typography>
            <Stack spacing={1}>
              {[
                "Space Planning",
                "Delivery & Installation",
                "Liquidation",
                "Reconfiguration",
                "Project Management",
              ].map((service) => (
                <Typography
                  key={service}
                  variant="body2"
                  sx={{
                    opacity: 0.7,
                    cursor: "pointer",
                    "&:hover": { opacity: 1, color: "#FFD700" },
                  }}
                  onClick={() => navigate("/services")}
                >
                  {service}
                </Typography>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Contact Info
            </Typography>
            <Stack spacing={1.5}>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                <strong>Email:</strong> info@nppfurniture.com
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                <strong>Phone:</strong> (555) 123-4567
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                <strong>Hours:</strong> Mon-Fri 8AM - 5PM
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                <strong>Address:</strong> 123 Furniture Lane
                <br />
                Boston, MA 02101
              </Typography>
            </Stack>
          </Grid>
        </Grid>
        <Box
          sx={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            mt: 4,
            pt: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.5 }}>
            &copy; {new Date().getFullYear()} NPP Office Furniture. All rights
            reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicFooter;
