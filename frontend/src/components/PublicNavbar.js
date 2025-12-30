import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

const PublicNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Services", path: "/services" },
    { label: "Catalog", path: "/catalog" },
    { label: "Contact", path: "/contact" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <Box
      sx={{
        bgcolor: "#003087",
        py: 2,
        px: 3,
        position: "sticky",
        top: 0,
        zIndex: 1100,
      }}
    >
      <Container maxWidth="xl">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            variant="h5"
            sx={{
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: 1,
              fontSize: { xs: "1.1rem", md: "1.5rem" },
            }}
            onClick={() => navigate("/")}
          >
            NPP Office Furniture
          </Typography>

          {isMobile ? (
            <>
              <IconButton
                sx={{ color: "white" }}
                onClick={() => setDrawerOpen(true)}
              >
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
              >
                <Box sx={{ width: 280, pt: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "flex-end", px: 2 }}>
                    <IconButton onClick={() => setDrawerOpen(false)}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  <List>
                    {navItems.map((item) => (
                      <ListItem key={item.label} disablePadding>
                        <ListItemButton
                          onClick={() => {
                            navigate(item.path);
                            setDrawerOpen(false);
                          }}
                          sx={{
                            bgcolor: isActive(item.path)
                              ? "rgba(0,48,135,0.1)"
                              : "transparent",
                          }}
                        >
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontWeight: isActive(item.path) ? 700 : 500,
                              color: isActive(item.path) ? "#003087" : "inherit",
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                    <ListItem disablePadding sx={{ mt: 2, px: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => {
                          navigate("/login");
                          setDrawerOpen(false);
                        }}
                        sx={{
                          bgcolor: "#003087",
                          "&:hover": { bgcolor: "#002266" },
                        }}
                      >
                        Login
                      </Button>
                    </ListItem>
                  </List>
                </Box>
              </Drawer>
            </>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  sx={{
                    color: "white",
                    fontWeight: isActive(item.path) ? 700 : 500,
                    borderBottom: isActive(item.path)
                      ? "2px solid #FFD700"
                      : "2px solid transparent",
                    borderRadius: 0,
                    px: 2,
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.1)",
                    },
                  }}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                variant="outlined"
                sx={{
                  color: "white",
                  borderColor: "white",
                  ml: 2,
                  "&:hover": { borderColor: "#FFD700", color: "#FFD700" },
                }}
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default PublicNavbar;
