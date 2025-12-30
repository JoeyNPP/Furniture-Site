import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Typography,
  Chip,
  CircularProgress,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Drawer,
  IconButton,
  Divider,
  useMediaQuery,
  AppBar,
  Toolbar,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import EmailIcon from "@mui/icons-material/Email";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { fetchPublicProducts, fetchProductFilters } from "../api";
import { theme } from "../theme";
import ProductImageGallery from "./ProductImageGallery";
import ProductDetailModal from "./ProductDetailModal";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";

const DRAWER_WIDTH = 280;

const Catalog = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [filterPanelOpen, setFilterPanelOpen] = useState(true); // For desktop toggle

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState({});
  const [selectedFobs, setSelectedFobs] = useState({});
  const [showInStockOnly, setShowInStockOnly] = useState(true);
  const [selectedForInvoice, setSelectedForInvoice] = useState({}); // {productId: quantity}

  // Furniture-specific filters
  const [selectedRoomTypes, setSelectedRoomTypes] = useState({});
  const [selectedStyles, setSelectedStyles] = useState({});
  const [selectedMaterials, setSelectedMaterials] = useState({});
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedConditions, setSelectedConditions] = useState({});
  const [selectedBrands, setSelectedBrands] = useState({});
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Dynamic filter options from API
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    room_types: [],
    styles: [],
    materials: [],
    colors: [],
    conditions: [],
    brands: [],
    fob_locations: [],
    price_range: { min: 0, max: 10000 },
  });

  const [sortBy, setSortBy] = useState("price_asc");

  // Sort options
  const sortOptions = [
    { value: "price_asc", label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
    { value: "title_asc", label: "Name: A → Z" },
    { value: "title_desc", label: "Name: Z → A" },
    { value: "brand_asc", label: "Brand: A → Z" },
    { value: "qty_desc", label: "Quantity: High → Low" },
  ];

  // Snackbar state for notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Product detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleOpenDetail = (product) => {
    setSelectedProduct(product);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToQuote = (product, qty) => {
    setSelectedForInvoice((prev) => ({
      ...prev,
      [product.id]: qty,
    }));
    setSnackbar({ open: true, message: `Added ${product.title} to quote`, severity: "success" });
  };

  // Helper to safely calculate deal cost
  const getDealCost = (p) => {
    const price = parseFloat(p.price) || 0;
    const moq = parseInt(p.moq) || 1;
    return price > 0 && moq > 0 ? price * moq : null;
  };

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch products and filter options in parallel
        const [productsData, filtersData] = await Promise.all([
          fetchPublicProducts(),
          fetchProductFilters().catch(() => null), // Don't fail if filters endpoint doesn't exist yet
        ]);
        setProducts(productsData);
        setFiltered(productsData);
        if (filtersData) {
          setFilterOptions(filtersData);
          setPriceRange([filtersData.price_range?.min || 0, filtersData.price_range?.max || 10000]);
        }
      } catch (err) {
        console.error("Failed to load catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Count active filters for badge
  useEffect(() => {
    let count = 0;
    if (Object.values(selectedCategories).some(Boolean)) count++;
    if (Object.values(selectedRoomTypes).some(Boolean)) count++;
    if (Object.values(selectedStyles).some(Boolean)) count++;
    if (Object.values(selectedMaterials).some(Boolean)) count++;
    if (Object.values(selectedColors).some(Boolean)) count++;
    if (Object.values(selectedConditions).some(Boolean)) count++;
    if (Object.values(selectedBrands).some(Boolean)) count++;
    if (Object.values(selectedFobs).some(Boolean)) count++;
    if (priceRange[0] > (filterOptions.price_range?.min || 0) || priceRange[1] < (filterOptions.price_range?.max || 10000)) count++;
    setActiveFiltersCount(count);
  }, [selectedCategories, selectedRoomTypes, selectedStyles, selectedMaterials, selectedColors, selectedConditions, selectedBrands, selectedFobs, priceRange, filterOptions]);

  useEffect(() => {
    let result = products;

    if (showInStockOnly) result = result.filter((p) => p.qty > 0 && !p.out_of_stock);
    if (search) {
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(search.toLowerCase()) ||
          p.asin?.toLowerCase().includes(search.toLowerCase()) ||
          p.upc?.toLowerCase().includes(search.toLowerCase()) ||
          p.brand?.toLowerCase().includes(search.toLowerCase()) ||
          p.material?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Helper to check if a comma-separated field contains any of the selected values
    const matchesMultiValue = (fieldValue, selectedValues) => {
      if (!fieldValue) return false;
      const productValues = fieldValue.split(",").map((v) => v.trim());
      return selectedValues.some((selected) => productValues.includes(selected));
    };

    const activeCats = Object.keys(selectedCategories).filter((k) => selectedCategories[k]);
    if (activeCats.length) result = result.filter((p) => activeCats.includes(p.category));

    // Furniture-specific filters - support comma-separated multi-values
    const activeRoomTypes = Object.keys(selectedRoomTypes).filter((k) => selectedRoomTypes[k]);
    if (activeRoomTypes.length) result = result.filter((p) => matchesMultiValue(p.room_type, activeRoomTypes));

    const activeStyles = Object.keys(selectedStyles).filter((k) => selectedStyles[k]);
    if (activeStyles.length) result = result.filter((p) => matchesMultiValue(p.style, activeStyles));

    const activeMaterials = Object.keys(selectedMaterials).filter((k) => selectedMaterials[k]);
    if (activeMaterials.length) result = result.filter((p) => matchesMultiValue(p.material, activeMaterials));

    const activeColors = Object.keys(selectedColors).filter((k) => selectedColors[k]);
    if (activeColors.length) result = result.filter((p) => matchesMultiValue(p.color, activeColors));

    const activeConditions = Object.keys(selectedConditions).filter((k) => selectedConditions[k]);
    if (activeConditions.length) result = result.filter((p) => p.condition && activeConditions.includes(p.condition));

    const activeBrands = Object.keys(selectedBrands).filter((k) => selectedBrands[k]);
    if (activeBrands.length) result = result.filter((p) => p.brand && activeBrands.includes(p.brand));

    const activeFobs = Object.keys(selectedFobs).filter((k) => selectedFobs[k]);
    if (activeFobs.length) result = result.filter((p) => p.fob && activeFobs.includes(p.fob));

    // Filter by price range
    if (priceRange[0] > 0 || priceRange[1] < (filterOptions.price_range?.max || 10000)) {
      result = result.filter((p) => {
        const price = parseFloat(p.price) || 0;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        case "price_desc":
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        case "title_asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title_desc":
          return (b.title || "").localeCompare(a.title || "");
        case "brand_asc":
          return (a.brand || "").localeCompare(b.brand || "");
        case "qty_desc":
          return (parseInt(b.qty) || 0) - (parseInt(a.qty) || 0);
        default:
          return 0;
      }
    });

    setFiltered(result);
  }, [search, selectedCategories, selectedRoomTypes, selectedStyles, selectedMaterials, selectedColors, selectedConditions, selectedBrands, selectedFobs, showInStockOnly, products, priceRange, sortBy, filterOptions]);

  // Derive filter options from products (fallback if API doesn't have data yet)
  const categories = filterOptions.categories.length > 0
    ? filterOptions.categories
    : [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
  const roomTypes = filterOptions.room_types.length > 0
    ? filterOptions.room_types
    : [...new Set(products.map((p) => p.room_type).filter(Boolean))].sort();
  const styles = filterOptions.styles.length > 0
    ? filterOptions.styles
    : [...new Set(products.map((p) => p.style).filter(Boolean))].sort();
  const materials = filterOptions.materials.length > 0
    ? filterOptions.materials
    : [...new Set(products.map((p) => p.material).filter(Boolean))].sort();
  const colors = filterOptions.colors.length > 0
    ? filterOptions.colors
    : [...new Set(products.map((p) => p.color).filter(Boolean))].sort();
  const conditions = filterOptions.conditions.length > 0
    ? filterOptions.conditions
    : ["New", "Refurbished", "Used"];
  const brands = filterOptions.brands.length > 0
    ? filterOptions.brands
    : [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
  const fobPorts = filterOptions.fob_locations.length > 0
    ? filterOptions.fob_locations
    : [...new Set(products.map((p) => p.fob).filter(Boolean))].sort();

  const toggleItem = (type, value) => {
    if (type === "category") {
      setSelectedCategories((prev) => ({ ...prev, [value]: !prev[value] }));
    } else if (type === "room_type") {
      setSelectedRoomTypes((prev) => ({ ...prev, [value]: !prev[value] }));
    } else if (type === "style") {
      setSelectedStyles((prev) => ({ ...prev, [value]: !prev[value] }));
    } else if (type === "material") {
      setSelectedMaterials((prev) => ({ ...prev, [value]: !prev[value] }));
    } else if (type === "color") {
      setSelectedColors((prev) => ({ ...prev, [value]: !prev[value] }));
    } else if (type === "condition") {
      setSelectedConditions((prev) => ({ ...prev, [value]: !prev[value] }));
    } else if (type === "brand") {
      setSelectedBrands((prev) => ({ ...prev, [value]: !prev[value] }));
    } else if (type === "fob") {
      setSelectedFobs((prev) => ({ ...prev, [value]: !prev[value] }));
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories({});
    setSelectedRoomTypes({});
    setSelectedStyles({});
    setSelectedMaterials({});
    setSelectedColors({});
    setSelectedConditions({});
    setSelectedBrands({});
    setSelectedFobs({});
    setPriceRange([filterOptions.price_range?.min || 0, filterOptions.price_range?.max || 10000]);
    setSearch("");
  };

  const toggleInvoice = (product) => {
    setSelectedForInvoice((prev) => {
      if (prev[product.id]) {
        // Remove from selection
        const { [product.id]: _, ...rest } = prev;
        return rest;
      } else {
        // Add with default qty = MOQ
        return { ...prev, [product.id]: product.moq || 1 };
      }
    });
  };

  const updateInvoiceQty = (productId, qty) => {
    setSelectedForInvoice((prev) => ({
      ...prev,
      [productId]: qty,
    }));
  };

  // Get MOQ multiples available for a product
  const getMoqOptions = (product) => {
    const moq = parseInt(product.moq) || 1;
    const available = parseInt(product.qty) || 0;
    const maxMultiples = Math.floor(available / moq);
    const remainder = available % moq;
    const options = [];
    // Add MOQ multiples (up to 10)
    for (let i = 1; i <= Math.min(maxMultiples, 10); i++) {
      options.push(moq * i);
    }
    // If there's a remainder and total qty isn't already in the list, add "all units" option
    if (remainder > 0 && available > 0 && !options.includes(available)) {
      options.push(available);
    }
    return options.length > 0 ? options : [moq];
  };

  // Generate mailto link for single product (same format as multi-product)
  const generateSingleProductEmail = (product, qty) => {
    const totalCost = (parseFloat(product.price) || 0) * qty;
    const asinPart = product.asin ? ` [${product.asin}]` : "";
    const subject = encodeURIComponent(`Invoice Request: 1 Product(s)${asinPart}`);

    const productList =
      `• ${product.title}\n` +
      `  ASIN: ${product.asin || "N/A"} | Price: $${product.price} | Qty: ${qty} | Total: $${totalCost.toLocaleString()}`;

    const body = encodeURIComponent(
      `Hi NPP Office Furniture Team,\n\n` +
      `I would like to request a quote for the following 1 product(s):\n\n` +
      `${productList}\n\n` +
      `Please send me a quote at your earliest convenience.\n\n` +
      `Thank you!`
    );
    return `mailto:sales@npp-office-furniture.com?subject=${subject}&body=${body}`;
  };

  // Generate mailto link for multiple products
  const generateMultiProductEmail = () => {
    const selectedIds = Object.keys(selectedForInvoice);
    const selectedProducts = products.filter((p) => selectedIds.includes(String(p.id)));
    const asins = selectedProducts.map((p) => p.asin).filter(Boolean).join(", ");
    const asinPart = asins ? ` [${asins}]` : "";
    const subject = encodeURIComponent(`Invoice Request: ${selectedProducts.length} Product(s)${asinPart}`);

    let productList = selectedProducts
      .map((p) => {
        const qty = selectedForInvoice[p.id];
        const totalCost = (parseFloat(p.price) || 0) * qty;
        return (
          `• ${p.title}\n` +
          `  ASIN: ${p.asin || "N/A"} | Price: $${p.price} | Qty: ${qty} | Total: $${totalCost.toLocaleString()}`
        );
      })
      .join("\n\n");

    const body = encodeURIComponent(
      `Hi NPP Office Furniture Team,\n\n` +
      `I would like to request a quote for the following ${selectedProducts.length} product(s):\n\n` +
      `${productList}\n\n` +
      `Please send me a quote at your earliest convenience.\n\n` +
      `Thank you!`
    );
    return `mailto:sales@npp-office-furniture.com?subject=${subject}&body=${body}`;
  };

  const selectedCount = Object.keys(selectedForInvoice).length;

  const handleRequestInvoice = () => {
    if (selectedCount === 0) {
      setSnackbar({ open: true, message: "Please select at least one product", severity: "warning" });
      return;
    }
    window.location.href = generateMultiProductEmail();
    setSelectedForInvoice({}); // Clear selection after opening email
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CircularProgress sx={{ display: "block", margin: "100px auto" }} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      {/* Site-wide Navigation */}
      <PublicNavbar />

      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "#F5F7FA" }}>
        {/* Catalog Header */}
        <AppBar position="sticky" sx={{ bgcolor: "white", boxShadow: 2 }}>
          <Toolbar sx={{ justifyContent: "space-between", minHeight: { xs: 64, md: 80 }, gap: 2 }}>
            {/* Left: Mobile menu + Logo + Home Link */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
              {isMobile && (
                <IconButton sx={{ color: "#003087" }} onClick={() => setDrawerOpen(true)}>
                  <MenuIcon />
                </IconButton>
              )}
              <Box
                component="a"
                href="/"
                sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
              >
                <Box
                  component="img"
                  src="/assets/logo.png"
                  alt="NPP Office Furniture"
                  sx={{
                    height: { xs: 48, sm: 56, md: 72 },
                    maxWidth: "280px",
                    objectFit: "contain",
                  }}
                />
              </Box>
            </Box>

            {/* Center: Title + Request Invoice Button */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  color: "#003087",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
                }}
              >
                OFFICE FURNITURE CATALOG
              </Typography>
              {selectedCount > 0 && (
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<ShoppingCartIcon />}
                  onClick={handleRequestInvoice}
                  sx={{ fontWeight: 600, minWidth: { xs: "auto", sm: 180 } }}
                >
                  <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                    Request Quote ({selectedCount})
                  </Box>
                  <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                    ({selectedCount})
                  </Box>
                </Button>
              )}
            </Box>

            {/* Right: Contact Info */}
            <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column", alignItems: "flex-end", gap: 0.5, minWidth: 180 }}>
              <Typography
                sx={{
                  color: "#003087",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Contact Us
              </Typography>
              <Typography
                component="a"
                href="mailto:sales@npp-office-furniture.com"
                sx={{
                  color: "#666",
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  "&:hover": { color: "#003087", textDecoration: "underline" },
                }}
              >
                sales@npp-office-furniture.com
              </Typography>
              <Typography
                component="a"
                href="tel:+16177802033"
                sx={{
                  color: "#666",
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  "&:hover": { color: "#003087", textDecoration: "underline" },
                }}
              >
                (617) 780-2033
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>
          {/* Filter Toggle Button - Always visible on desktop */}
          {!isMobile && (
            <Tooltip title={filterPanelOpen ? "Hide Filters" : "Show Filters"}>
              <IconButton
                onClick={() => setFilterPanelOpen(!filterPanelOpen)}
                sx={{
                  position: "fixed",
                  left: filterPanelOpen ? DRAWER_WIDTH - 20 : 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 1300,
                  bgcolor: "#003087",
                  color: "white",
                  boxShadow: 2,
                  "&:hover": { bgcolor: "#002060" },
                  transition: "left 0.3s ease",
                }}
              >
                <Badge badgeContent={activeFiltersCount} color="error">
                  {filterPanelOpen ? <ChevronLeftIcon /> : <FilterListIcon />}
                </Badge>
              </IconButton>
            </Tooltip>
          )}

          {/* Sidebar - collapsible on desktop, drawer on mobile */}
          <Drawer
            variant={isMobile ? "temporary" : "persistent"}
            open={isMobile ? drawerOpen : filterPanelOpen}
            onClose={() => setDrawerOpen(false)}
            sx={{
              width: filterPanelOpen ? DRAWER_WIDTH : 0,
              flexShrink: 0,
              transition: "width 0.3s ease",
              "& .MuiDrawer-paper": {
                width: DRAWER_WIDTH,
                boxSizing: "border-box",
                p: 2,
                bgcolor: "white",
                borderRight: "1px solid #e0e0e0",
                mt: { xs: 0, md: "80px" },
                height: { xs: "100%", md: "calc(100vh - 80px)" },
                overflowY: "auto",
                overflowX: "hidden",
              },
            }}
          >
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(false)} sx={{ alignSelf: "flex-end" }}>
                <ClearIcon />
              </IconButton>
            )}

            {/* Filter Header with Clear All */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, px: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#003087", fontSize: "1rem" }}>
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Typography>
              {activeFiltersCount > 0 && (
                <Button size="small" onClick={clearAllFilters} startIcon={<ClearIcon />} sx={{ fontSize: "0.75rem" }}>
                  Clear
                </Button>
              )}
            </Box>

            {/* In Stock Only - Always visible at top */}
            <Box sx={{ px: 1, mb: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showInStockOnly}
                    onChange={(e) => setShowInStockOnly(e.target.checked)}
                    size="small"
                    sx={{ color: "#00A651", "&.Mui-checked": { color: "#00A651" } }}
                  />
                }
                label={<Typography variant="body2">In Stock Only</Typography>}
              />
            </Box>

            {/* Price Range Accordion */}
            <Accordion defaultExpanded disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, px: 1 }}>
                <Typography sx={{ fontWeight: 600, color: "#003087", fontSize: "0.875rem" }}>
                  Price Range
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pt: 0 }}>
                <Slider
                  value={priceRange}
                  onChange={(e, newValue) => setPriceRange(newValue)}
                  valueLabelDisplay="auto"
                  min={filterOptions.price_range?.min || 0}
                  max={filterOptions.price_range?.max || 10000}
                  valueLabelFormat={(value) => `$${value.toLocaleString()}`}
                  size="small"
                  sx={{ color: "#003087" }}
                />
                <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#666" }}>
                  <span>${priceRange[0].toLocaleString()}</span>
                  <span>${priceRange[1].toLocaleString()}</span>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Room Type Accordion */}
            {roomTypes.length > 0 && (
              <Accordion disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, px: 1 }}>
                  <Typography sx={{ fontWeight: 600, color: "#003087", fontSize: "0.875rem" }}>
                    Room Type
                    {Object.values(selectedRoomTypes).some(Boolean) && (
                      <Chip size="small" label={Object.values(selectedRoomTypes).filter(Boolean).length} sx={{ ml: 1, height: 18, fontSize: "0.7rem" }} color="primary" />
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pt: 0, maxHeight: 150, overflow: "auto" }}>
                  <FormGroup>
                    {roomTypes.map((room) => (
                      <FormControlLabel
                        key={room}
                        control={
                          <Checkbox
                            size="small"
                            checked={!!selectedRoomTypes[room]}
                            onChange={() => toggleItem("room_type", room)}
                            sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" }, py: 0.25 }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>{room}</Typography>}
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Style Accordion */}
            {styles.length > 0 && (
              <Accordion disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, px: 1 }}>
                  <Typography sx={{ fontWeight: 600, color: "#003087", fontSize: "0.875rem" }}>
                    Style
                    {Object.values(selectedStyles).some(Boolean) && (
                      <Chip size="small" label={Object.values(selectedStyles).filter(Boolean).length} sx={{ ml: 1, height: 18, fontSize: "0.7rem" }} color="primary" />
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pt: 0, maxHeight: 150, overflow: "auto" }}>
                  <FormGroup>
                    {styles.map((style) => (
                      <FormControlLabel
                        key={style}
                        control={
                          <Checkbox
                            size="small"
                            checked={!!selectedStyles[style]}
                            onChange={() => toggleItem("style", style)}
                            sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" }, py: 0.25 }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>{style}</Typography>}
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Material Accordion */}
            {materials.length > 0 && (
              <Accordion disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, px: 1 }}>
                  <Typography sx={{ fontWeight: 600, color: "#003087", fontSize: "0.875rem" }}>
                    Material
                    {Object.values(selectedMaterials).some(Boolean) && (
                      <Chip size="small" label={Object.values(selectedMaterials).filter(Boolean).length} sx={{ ml: 1, height: 18, fontSize: "0.7rem" }} color="primary" />
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pt: 0, maxHeight: 150, overflow: "auto" }}>
                  <FormGroup>
                    {materials.map((mat) => (
                      <FormControlLabel
                        key={mat}
                        control={
                          <Checkbox
                            size="small"
                            checked={!!selectedMaterials[mat]}
                            onChange={() => toggleItem("material", mat)}
                            sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" }, py: 0.25 }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>{mat}</Typography>}
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Color Accordion */}
            {colors.length > 0 && (
              <Accordion disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, px: 1 }}>
                  <Typography sx={{ fontWeight: 600, color: "#003087", fontSize: "0.875rem" }}>
                    Color
                    {Object.values(selectedColors).some(Boolean) && (
                      <Chip size="small" label={Object.values(selectedColors).filter(Boolean).length} sx={{ ml: 1, height: 18, fontSize: "0.7rem" }} color="primary" />
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pt: 0, maxHeight: 150, overflow: "auto" }}>
                  <FormGroup>
                    {colors.map((color) => (
                      <FormControlLabel
                        key={color}
                        control={
                          <Checkbox
                            size="small"
                            checked={!!selectedColors[color]}
                            onChange={() => toggleItem("color", color)}
                            sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" }, py: 0.25 }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>{color}</Typography>}
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Condition Accordion */}
            {conditions.length > 0 && (
              <Accordion disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, px: 1 }}>
                  <Typography sx={{ fontWeight: 600, color: "#003087", fontSize: "0.875rem" }}>
                    Condition
                    {Object.values(selectedConditions).some(Boolean) && (
                      <Chip size="small" label={Object.values(selectedConditions).filter(Boolean).length} sx={{ ml: 1, height: 18, fontSize: "0.7rem" }} color="primary" />
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pt: 0 }}>
                  <FormGroup>
                    {conditions.map((cond) => (
                      <FormControlLabel
                        key={cond}
                        control={
                          <Checkbox
                            size="small"
                            checked={!!selectedConditions[cond]}
                            onChange={() => toggleItem("condition", cond)}
                            sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" }, py: 0.25 }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>{cond}</Typography>}
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Brand Accordion */}
            {brands.length > 0 && (
              <Accordion disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, px: 1 }}>
                  <Typography sx={{ fontWeight: 600, color: "#003087", fontSize: "0.875rem" }}>
                    Brand
                    {Object.values(selectedBrands).some(Boolean) && (
                      <Chip size="small" label={Object.values(selectedBrands).filter(Boolean).length} sx={{ ml: 1, height: 18, fontSize: "0.7rem" }} color="primary" />
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pt: 0, maxHeight: 150, overflow: "auto" }}>
                  <FormGroup>
                    {brands.map((brand) => (
                      <FormControlLabel
                        key={brand}
                        control={
                          <Checkbox
                            size="small"
                            checked={!!selectedBrands[brand]}
                            onChange={() => toggleItem("brand", brand)}
                            sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" }, py: 0.25 }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>{brand}</Typography>}
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Categories Accordion */}
            {categories.length > 0 && (
              <Accordion disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, px: 1 }}>
                  <Typography sx={{ fontWeight: 600, color: "#003087", fontSize: "0.875rem" }}>
                    Categories
                    {Object.values(selectedCategories).some(Boolean) && (
                      <Chip size="small" label={Object.values(selectedCategories).filter(Boolean).length} sx={{ ml: 1, height: 18, fontSize: "0.7rem" }} color="primary" />
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pt: 0, maxHeight: 150, overflow: "auto" }}>
                  <FormGroup>
                    {categories.map((cat) => (
                      <FormControlLabel
                        key={cat}
                        control={
                          <Checkbox
                            size="small"
                            checked={!!selectedCategories[cat]}
                            onChange={() => toggleItem("category", cat)}
                            sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" }, py: 0.25 }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>{cat}</Typography>}
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            )}

            {/* FOB Location Accordion */}
            {fobPorts.length > 0 && (
              <Accordion disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, px: 1 }}>
                  <Typography sx={{ fontWeight: 600, color: "#003087", fontSize: "0.875rem" }}>
                    FOB Location
                    {Object.values(selectedFobs).some(Boolean) && (
                      <Chip size="small" label={Object.values(selectedFobs).filter(Boolean).length} sx={{ ml: 1, height: 18, fontSize: "0.7rem" }} color="primary" />
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pt: 0, maxHeight: 120, overflow: "auto" }}>
                  <FormGroup>
                    {fobPorts.map((fob) => (
                      <FormControlLabel
                        key={fob}
                        control={
                          <Checkbox
                            size="small"
                            checked={!!selectedFobs[fob]}
                            onChange={() => toggleItem("fob", fob)}
                            sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" }, py: 0.25 }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>{fob}</Typography>}
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            )}
          </Drawer>

          {/* Main Content - takes remaining space */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, md: 3 },
              transition: "margin 0.3s ease",
              overflowX: "hidden",
            }}
          >
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                label="Search by title, brand, or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flexGrow: 1, maxWidth: 500, bgcolor: "white", borderRadius: 1 }}
              />
              <FormControl sx={{ minWidth: 200, bgcolor: "white", borderRadius: 1 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {sortOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Typography gutterBottom sx={{ color: "#555", mb: 3 }}>
              Showing {filtered.length} products
              {selectedCount > 0 && (
                <Chip
                  label={`${selectedCount} selected`}
                  color="primary"
                  size="small"
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>

            <Grid container spacing={3} sx={{ justifyContent: { xs: "center", md: "flex-start" } }}>
              {filtered.map((p) => (
                <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={p.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: "white",
                      borderRadius: 2,
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 24px rgba(0,48,135,0.15)",
                      },
                    }}
                    onClick={() => handleOpenDetail(p)}
                  >
                    <Box sx={{ position: "relative" }}>
                      <ProductImageGallery
                        mainImage={p.image_url}
                        secondaryImages={p.secondary_images}
                        title={p.title}
                        height={200}
                        showThumbnails={false}
                        enableZoom={false}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          bgcolor: "rgba(255,255,255,0.95)",
                          borderRadius: 1,
                          px: 0.5,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={!!selectedForInvoice[p.id]}
                          onChange={() => toggleInvoice(p)}
                          sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" }, p: 0.5 }}
                        />
                        {selectedForInvoice[p.id] && (
                          <Select
                            size="small"
                            value={selectedForInvoice[p.id]}
                            onChange={(e) => updateInvoiceQty(p.id, e.target.value)}
                            sx={{ minWidth: 70, height: 32, fontSize: "0.8rem" }}
                          >
                            {getMoqOptions(p).map((qty) => (
                              <MenuItem key={qty} value={qty}>
                                {qty}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      </Box>
                      {/* Condition badge */}
                      {p.condition && (
                        <Chip
                          label={p.condition}
                          size="small"
                          color={p.condition === "New" ? "success" : p.condition === "Refurbished" ? "warning" : "default"}
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            fontWeight: 600,
                          }}
                        />
                      )}
                      {/* Multiple images indicator */}
                      {p.secondary_images && p.secondary_images.length > 0 && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 8,
                            right: 8,
                            bgcolor: "rgba(0,0,0,0.6)",
                            color: "white",
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                          }}
                        >
                          +{p.secondary_images.length} photos
                        </Box>
                      )}
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                        {p.title}
                      </Typography>
                      {/* Brand */}
                      {p.brand && (
                        <Typography variant="body2" sx={{ color: "#666", fontStyle: "italic", mt: 0.25 }}>
                          {p.brand}
                        </Typography>
                      )}
                      {p.asin && (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#003087", mt: 0.5 }}>
                          ASIN: {p.asin}
                        </Typography>
                      )}
                      <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip label={`$${p.price}`} color="primary" size="small" />
                        <Chip label={`MOQ ${p.moq}`} size="small" variant="outlined" />
                        <Chip
                          label={`${p.qty} In Stock`}
                          color={p.qty > 0 ? "success" : "error"}
                          size="small"
                        />
                        {p.fob && <Chip label={p.fob} variant="outlined" size="small" />}
                      </Box>
                      {/* Furniture-specific details */}
                      <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {/* Dimensions */}
                        {(p.width || p.depth || p.height) && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Dimensions:</strong>{" "}
                            {[
                              p.width && `${p.width}"W`,
                              p.depth && `${p.depth}"D`,
                              p.height && `${p.height}"H`,
                            ]
                              .filter(Boolean)
                              .join(" x ")}
                          </Typography>
                        )}
                        {/* Material */}
                        {p.material && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Material:</strong> {p.material}
                          </Typography>
                        )}
                        {/* Color */}
                        {p.color && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Color:</strong> {p.color}
                          </Typography>
                        )}
                        {p.lead_time && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Lead Time:</strong> {p.lead_time}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                    <CardActions
                      sx={{ px: 2, pb: 2, pt: 0, justifyContent: "flex-end" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<EmailIcon />}
                        onClick={() => {
                          // Add this product to selection with default MOQ qty, then trigger email
                          const qty = selectedForInvoice[p.id] || p.moq || 1;
                          const tempSelection = { ...selectedForInvoice, [p.id]: qty };
                          const selectedIds = Object.keys(tempSelection);
                          const selectedProducts = products.filter((prod) => selectedIds.includes(String(prod.id)));
                          const asins = selectedProducts.map((prod) => prod.asin).filter(Boolean).join(", ");
                          const asinPart = asins ? ` [${asins}]` : "";
                          const subject = encodeURIComponent(`Invoice Request: ${selectedProducts.length} Product(s)${asinPart}`);
                          const productList = selectedProducts
                            .map((prod) => {
                              const prodQty = tempSelection[prod.id];
                              const totalCost = (parseFloat(prod.price) || 0) * prodQty;
                              return (
                                `• ${prod.title}\n` +
                                `  ASIN: ${prod.asin || "N/A"} | Price: $${prod.price} | Qty: ${prodQty} | Total: $${totalCost.toLocaleString()}`
                              );
                            })
                            .join("\n\n");
                          const body = encodeURIComponent(
                            `Hi NPP Office Furniture Team,\n\n` +
                            `I would like to request a quote for the following ${selectedProducts.length} product(s):\n\n` +
                            `${productList}\n\n` +
                            `Please send me a quote at your earliest convenience.\n\n` +
                            `Thank you!`
                          );
                          window.location.href = `mailto:sales@npp-office-furniture.com?subject=${subject}&body=${body}`;
                        }}
                        sx={{
                          fontWeight: 600,
                          textTransform: "none",
                        }}
                      >
                        Request Quote
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* Product Detail Modal */}
        <ProductDetailModal
          open={detailModalOpen}
          onClose={handleCloseDetail}
          product={selectedProduct}
          onAddToQuote={handleAddToQuote}
          isSelected={selectedProduct ? !!selectedForInvoice[selectedProduct.id] : false}
          selectedQty={selectedProduct ? selectedForInvoice[selectedProduct.id] : null}
          onQtyChange={(qty) => selectedProduct && updateInvoiceQty(selectedProduct.id, qty)}
        />

        {/* Snackbar for notifications */}
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

      {/* Site-wide Footer */}
      <PublicFooter />
    </ThemeProvider>
  );
};

export default Catalog;
