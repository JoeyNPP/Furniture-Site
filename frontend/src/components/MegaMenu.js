import React, { useState } from "react";
import {
  Box,
  Button,
  Popover,
  Typography,
  Grid,
  Paper,
  Divider,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChairIcon from "@mui/icons-material/Chair";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import WeekendIcon from "@mui/icons-material/Weekend";

// Furniture category structure with icons and subcategories
const FURNITURE_CATEGORIES = {
  "Shop by Category": {
    icon: <ChairIcon />,
    items: [
      { name: "Desks", description: "Executive, standing, L-shaped & more", image: "/assets/categories/desks.jpg" },
      { name: "Chairs", description: "Task, executive, ergonomic seating", image: "/assets/categories/chairs.jpg" },
      { name: "Cubicles & Workstations", description: "Modular office systems", image: "/assets/categories/cubicles.jpg" },
      { name: "Conference Tables", description: "Meeting & boardroom tables", image: "/assets/categories/conference.jpg" },
      { name: "Filing & Storage", description: "Cabinets, shelving, lockers", image: "/assets/categories/storage.jpg" },
      { name: "Reception Furniture", description: "Desks, sofas & waiting area", image: "/assets/categories/reception.jpg" },
      { name: "Bookcases & Shelving", description: "Display and storage units", image: "/assets/categories/bookcases.jpg" },
      { name: "Tables", description: "Training, folding, café tables", image: "/assets/categories/tables.jpg" },
    ],
  },
  "Shop by Room": {
    icon: <MeetingRoomIcon />,
    items: [
      { name: "Private Office", description: "Executive suites & management", image: "/assets/rooms/private-office.jpg" },
      { name: "Open Office", description: "Collaborative workspaces", image: "/assets/rooms/open-office.jpg" },
      { name: "Conference Room", description: "Meeting spaces of all sizes", image: "/assets/rooms/conference.jpg" },
      { name: "Reception Area", description: "First impressions matter", image: "/assets/rooms/reception.jpg" },
      { name: "Break Room", description: "Café & lounge furniture", image: "/assets/rooms/breakroom.jpg" },
      { name: "Training Room", description: "Flexible learning spaces", image: "/assets/rooms/training.jpg" },
      { name: "Home Office", description: "Work from home solutions", image: "/assets/rooms/home-office.jpg" },
    ],
  },
  "Shop by Style": {
    icon: <WeekendIcon />,
    items: [
      { name: "Modern", description: "Clean lines, minimalist design", image: "/assets/styles/modern.jpg" },
      { name: "Traditional", description: "Classic, timeless elegance", image: "/assets/styles/traditional.jpg" },
      { name: "Industrial", description: "Raw materials, urban aesthetic", image: "/assets/styles/industrial.jpg" },
      { name: "Contemporary", description: "Current trends & fresh looks", image: "/assets/styles/contemporary.jpg" },
      { name: "Mid-Century", description: "Retro-inspired classics", image: "/assets/styles/midcentury.jpg" },
      { name: "Rustic", description: "Natural wood, warm finishes", image: "/assets/styles/rustic.jpg" },
    ],
  },
};

const QUICK_LINKS = [
  { name: "New Arrivals", color: "#00A651" },
  { name: "Best Sellers", color: "#FF6B00" },
  { name: "Clearance", color: "#E53238" },
  { name: "Bulk Orders", color: "#003087" },
];

const MegaMenu = ({ onFilterChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const handleMenuOpen = (event, menuKey) => {
    setAnchorEl(event.currentTarget);
    setActiveMenu(menuKey);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveMenu(null);
  };

  const handleItemClick = (menuType, itemName) => {
    handleMenuClose();
    if (onFilterChange) {
      // Map menu type to filter field
      const filterMap = {
        "Shop by Category": "category",
        "Shop by Room": "room_type",
        "Shop by Style": "style",
      };
      onFilterChange(filterMap[menuType], itemName);
    }
  };

  const handleQuickLinkClick = (linkName) => {
    if (onFilterChange) {
      onFilterChange("quickLink", linkName);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1,
        bgcolor: "#003087",
        borderBottom: "3px solid #00A651",
      }}
    >
      {/* Main Category Menus */}
      {Object.entries(FURNITURE_CATEGORIES).map(([menuKey, menuData]) => (
        <Box key={menuKey}>
          <Button
            onClick={(e) => handleMenuOpen(e, menuKey)}
            endIcon={<KeyboardArrowDownIcon />}
            sx={{
              color: "white",
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.95rem",
              px: 2,
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            {menuKey}
          </Button>
          <Popover
            open={activeMenu === menuKey}
            anchorEl={anchorEl}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                minWidth: 700,
                maxWidth: 900,
              },
            }}
          >
            <Paper sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ color: "#003087", fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                {menuData.icon}
                {menuKey}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {menuData.items.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.name}>
                    <Box
                      onClick={() => handleItemClick(menuKey, item.name)}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": {
                          bgcolor: "#f5f7fa",
                          transform: "translateX(4px)",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 1,
                            bgcolor: "#e8e8e8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          {/* Placeholder - will show category icon or image */}
                          <Box
                            component="img"
                            src={item.image}
                            alt={item.name}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: "#003087",
                              fontSize: "0.95rem",
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "#666", fontSize: "0.8rem" }}
                          >
                            {item.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Button
                variant="text"
                sx={{ color: "#003087", fontWeight: 600 }}
                onClick={() => handleItemClick(menuKey, "All")}
              >
                View All {menuKey.replace("Shop by ", "")} →
              </Button>
            </Paper>
          </Popover>
        </Box>
      ))}

      {/* Quick Links */}
      <Box sx={{ flexGrow: 1 }} />
      {QUICK_LINKS.map((link) => (
        <Button
          key={link.name}
          onClick={() => handleQuickLinkClick(link.name)}
          sx={{
            color: "white",
            fontWeight: 600,
            textTransform: "none",
            fontSize: "0.9rem",
            bgcolor: link.color,
            px: 2,
            py: 0.5,
            borderRadius: 1,
            "&:hover": {
              bgcolor: link.color,
              filter: "brightness(1.1)",
            },
          }}
        >
          {link.name}
        </Button>
      ))}
    </Box>
  );
};

// Export category data for use in filters
export const FURNITURE_CATEGORY_OPTIONS = FURNITURE_CATEGORIES["Shop by Category"].items.map((i) => i.name);
export const ROOM_TYPE_OPTIONS = FURNITURE_CATEGORIES["Shop by Room"].items.map((i) => i.name);
export const STYLE_OPTIONS = FURNITURE_CATEGORIES["Shop by Style"].items.map((i) => i.name);

export default MegaMenu;
