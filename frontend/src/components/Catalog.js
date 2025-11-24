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
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import EmailIcon from "@mui/icons-material/Email";
import { fetchPublicProducts } from "../api";
import { theme } from "../theme";

const Catalog = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState({});
  const [selectedFobs, setSelectedFobs] = useState({});
  const [selectedMarketplaces, setSelectedMarketplaces] = useState({});
  const [showInStockOnly, setShowInStockOnly] = useState(true);
  const [selectedForInvoice, setSelectedForInvoice] = useState({}); // {productId: quantity}
  const [dealCostRange, setDealCostRange] = useState([0, Infinity]);

  // Deal cost preset options
  const dealCostPresets = [
    { label: "All Deals", range: [0, Infinity] },
    { label: "Under $1K", range: [0, 1000] },
    { label: "$1K – $2.5K", range: [1000, 2500] },
    { label: "$2.5K – $5K", range: [2500, 5000] },
    { label: "$5K – $10K", range: [5000, 10000] },
    { label: "$10K+", range: [10000, Infinity] },
  ];
  const [sortBy, setSortBy] = useState("newest");

  // Sort options
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price_asc", label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
    { value: "deal_asc", label: "Deal Cost: Low → High" },
    { value: "deal_desc", label: "Deal Cost: High → Low" },
    { value: "moq_asc", label: "MOQ: Low → High" },
    { value: "moq_desc", label: "MOQ: High → Low" },
  ];

  // Snackbar state for notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Helper to safely calculate deal cost
  const getDealCost = (p) => {
    const price = parseFloat(p.price) || 0;
    const moq = parseInt(p.moq) || 1;
    return price > 0 && moq > 0 ? price * moq : null;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPublicProducts();
        setProducts(data);
        setFiltered(data);
      } catch (err) {
        console.error("Failed to load catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let result = products;

    if (showInStockOnly) result = result.filter((p) => p.qty > 0 && !p.out_of_stock);
    if (search) {
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(search.toLowerCase()) ||
          p.asin?.toLowerCase().includes(search.toLowerCase()) ||
          p.upc?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const activeCats = Object.keys(selectedCategories).filter((k) => selectedCategories[k]);
    if (activeCats.length) result = result.filter((p) => activeCats.includes(p.category));

    const activeFobs = Object.keys(selectedFobs).filter((k) => selectedFobs[k]);
    if (activeFobs.length) result = result.filter((p) => p.fob && activeFobs.includes(p.fob));

    // Filter by marketplace
    const activeMarketplaces = Object.keys(selectedMarketplaces).filter((k) => selectedMarketplaces[k]);
    if (activeMarketplaces.length) {
      result = result.filter((p) => {
        if (activeMarketplaces.includes("Amazon") && p.amazon_url) return true;
        if (activeMarketplaces.includes("Walmart") && p.walmart_url) return true;
        if (activeMarketplaces.includes("eBay") && p.ebay_url) return true;
        return false;
      });
    }

    // Filter by deal cost range
    if (dealCostRange[0] > 0 || dealCostRange[1] !== Infinity) {
      result = result.filter((p) => {
        const cost = getDealCost(p);
        if (cost === null) return true; // Include products without valid deal cost
        return cost >= dealCostRange[0] &&
               (dealCostRange[1] === Infinity || cost <= dealCostRange[1]);
      });
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.offer_date || b.created_at || 0) - new Date(a.offer_date || a.created_at || 0);
        case "oldest":
          return new Date(a.offer_date || a.created_at || 0) - new Date(b.offer_date || b.created_at || 0);
        case "price_asc":
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        case "price_desc":
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        case "deal_asc":
          return (getDealCost(a) || 0) - (getDealCost(b) || 0);
        case "deal_desc":
          return (getDealCost(b) || 0) - (getDealCost(a) || 0);
        case "moq_asc":
          return (parseInt(a.moq) || 0) - (parseInt(b.moq) || 0);
        case "moq_desc":
          return (parseInt(b.moq) || 0) - (parseInt(a.moq) || 0);
        default:
          return 0;
      }
    });

    setFiltered(result);
  }, [search, selectedCategories, selectedFobs, selectedMarketplaces, showInStockOnly, products, dealCostRange, sortBy]);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
  const fobPorts = [...new Set(products.map((p) => p.fob).filter(Boolean))].sort();
  const marketplaces = ["Amazon", "Walmart", "eBay"];

  const toggleItem = (type, value) => {
    if (type === "category") {
      setSelectedCategories((prev) => ({ ...prev, [value]: !prev[value] }));
    } else if (type === "fob") {
      setSelectedFobs((prev) => ({ ...prev, [value]: !prev[value] }));
    } else if (type === "marketplace") {
      setSelectedMarketplaces((prev) => ({ ...prev, [value]: !prev[value] }));
    }
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

  // Generate mailto link for single product
  const generateSingleProductEmail = (product) => {
    const dealCost = getDealCost(product);
    const asinPart = product.asin ? ` [${product.asin}]` : "";
    const subject = encodeURIComponent(`Invoice Request: ${product.title}${asinPart}`);
    const body = encodeURIComponent(
      `Hi NPP Sales Team,\n\n` +
      `I would like to request an invoice for the following product:\n\n` +
      `Product: ${product.title}\n` +
      `ASIN: ${product.asin || "N/A"}\n` +
      `UPC: ${product.upc || "N/A"}\n` +
      `Price: $${product.price}\n` +
      `MOQ: ${product.moq}\n` +
      `Deal Cost: $${dealCost ? dealCost.toLocaleString() : "N/A"}\n` +
      `Qty Available: ${product.qty}\n` +
      `FOB: ${product.fob || "N/A"}\n\n` +
      `Please send me an invoice at your earliest convenience.\n\n` +
      `Thank you!`
    );
    return `mailto:sales@nat-procurement.com?subject=${subject}&body=${body}`;
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
      `Hi NPP Sales Team,\n\n` +
      `I would like to request an invoice for the following ${selectedProducts.length} product(s):\n\n` +
      `${productList}\n\n` +
      `Please send me an invoice at your earliest convenience.\n\n` +
      `Thank you!`
    );
    return `mailto:sales@nat-procurement.com?subject=${subject}&body=${body}`;
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
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "#F5F7FA" }}>
        {/* Header */}
        <AppBar position="sticky" sx={{ bgcolor: "#003087", py: { xs: 1, md: 2 }, boxShadow: 3 }}>
          <Toolbar sx={{ justifyContent: "space-between", minHeight: { xs: 64, md: 80 } }}>
            {/* Mobile menu + Logo on the left */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isMobile && (
                <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
                  <MenuIcon />
                </IconButton>
              )}
              <Box
                component="img"
                src="/assets/logo.png"
                alt="NPP Deals"
                sx={{
                  height: { xs: 56, sm: 64, md: 80 },
                  maxWidth: "320px",
                  objectFit: "contain",
                }}
              />
            </Box>

            {/* Title in the center */}
            <Typography
              variant="h5"
              sx={{
                color: "white",
                fontWeight: 700,
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                display: { xs: "none", sm: "block" },
              }}
            >
              LIVE CATALOG
            </Typography>

            {/* Request Invoice button */}
            {selectedCount > 0 ? (
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<ShoppingCartIcon />}
                onClick={handleRequestInvoice}
                sx={{ fontWeight: 600 }}
              >
                Request Invoice ({selectedCount})
              </Button>
            ) : (
              <Box sx={{ width: { xs: 0, md: 200 } }} />
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>
          {/* Sidebar - fixed 320px on desktop, drawer on mobile */}
          <Drawer
            variant={isMobile ? "temporary" : "permanent"}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            sx={{
              width: 320,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: 320,
                boxSizing: "border-box",
                p: 3,
                bgcolor: "white",
                borderRight: "1px solid #e0e0e0",
                mt: { xs: 0, md: "112px" },
                height: { xs: "100%", md: "calc(100vh - 112px)" },
              },
            }}
          >
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(false)} sx={{ alignSelf: "flex-end" }}>
                x
              </IconButton>
            )}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#003087" }}>
              Deal Cost (per MOQ)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {dealCostPresets.map(({ label, range }) => {
                const isActive =
                  dealCostRange[0] === range[0] &&
                  (range[1] === Infinity
                    ? dealCostRange[1] === Infinity
                    : dealCostRange[1] === range[1]);
                return (
                  <Button
                    key={label}
                    variant={isActive ? "contained" : "outlined"}
                    color={label === "All Deals" ? "secondary" : "primary"}
                    size="small"
                    onClick={() => setDealCostRange(range)}
                    sx={{ minWidth: 90 }}
                  >
                    {label}
                  </Button>
                );
              })}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#003087" }}>
              Marketplace
            </Typography>
            <FormGroup>
              {marketplaces.map((mp) => (
                <FormControlLabel
                  key={mp}
                  control={
                    <Checkbox
                      checked={!!selectedMarketplaces[mp]}
                      onChange={() => toggleItem("marketplace", mp)}
                      sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" } }}
                    />
                  }
                  label={mp}
                />
              ))}
            </FormGroup>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#003087" }}>
              Categories
            </Typography>
            <FormGroup>
              {categories.map((cat) => (
                <FormControlLabel
                  key={cat}
                  control={
                    <Checkbox
                      checked={!!selectedCategories[cat]}
                      onChange={() => toggleItem("category", cat)}
                      sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" } }}
                    />
                  }
                  label={cat}
                />
              ))}
            </FormGroup>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#003087" }}>
              FOB Ports
            </Typography>
            <FormGroup>
              {fobPorts.map((fob) => (
                <FormControlLabel
                  key={fob}
                  control={
                    <Checkbox
                      checked={!!selectedFobs[fob]}
                      onChange={() => toggleItem("fob", fob)}
                      sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" } }}
                    />
                  }
                  label={fob}
                />
              ))}
            </FormGroup>
            <Divider sx={{ my: 2 }} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showInStockOnly}
                  onChange={(e) => setShowInStockOnly(e.target.checked)}
                  sx={{ color: "#00A651", "&.Mui-checked": { color: "#00A651" } }}
                />
              }
              label="In Stock Only"
            />
          </Drawer>

          {/* Main Content - takes remaining space */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, md: 4 },
              width: { xs: "100%", md: "calc(100% - 320px)" },
              ml: { xs: 0, md: 0 },
              overflowX: "hidden",
            }}
          >
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                label="Search by title, ASIN, or UPC..."
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
                    }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={p.image_url || "/no-image.png"}
                        alt={p.title}
                        sx={{ objectFit: "contain", bgcolor: "#f9f9f9" }}
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
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                        {p.title}
                      </Typography>
                      {p.asin && (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#003087", mt: 0.5 }}>
                          ASIN: {p.asin}
                        </Typography>
                      )}
                      {p.upc && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          UPC: {p.upc}
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
                        {(() => {
                          const dealCost = getDealCost(p);
                          if (!dealCost) return null;
                          return (
                            <Chip
                              label={`Deal: $${dealCost.toLocaleString()}`}
                              size="small"
                              sx={{
                                bgcolor: "#003087",
                                color: "white",
                                fontWeight: 600,
                              }}
                            />
                          );
                        })()}
                      </Box>
                      <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {p.lead_time && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Lead Time:</strong> {p.lead_time}
                          </Typography>
                        )}
                        {p.exp_date && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Exp Date:</strong> {p.exp_date}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {p.amazon_url && (
                          <Button
                            size="small"
                            variant="contained"
                            href={p.amazon_url}
                            target="_blank"
                            sx={{
                              bgcolor: "#FF9900",
                              color: "#000",
                              "&:hover": { bgcolor: "#E68A00" },
                              fontWeight: 600,
                              textTransform: "none",
                            }}
                          >
                            Amazon
                          </Button>
                        )}
                        {p.walmart_url && (
                          <Button
                            size="small"
                            variant="contained"
                            href={p.walmart_url}
                            target="_blank"
                            sx={{
                              bgcolor: "#0071CE",
                              color: "#fff",
                              "&:hover": { bgcolor: "#005BA1" },
                              fontWeight: 600,
                              textTransform: "none",
                            }}
                          >
                            Walmart
                          </Button>
                        )}
                        {p.ebay_url && (
                          <Button
                            size="small"
                            variant="contained"
                            href={p.ebay_url}
                            target="_blank"
                            sx={{
                              bgcolor: "#E53238",
                              color: "#fff",
                              "&:hover": { bgcolor: "#C72C31" },
                              fontWeight: 600,
                              textTransform: "none",
                            }}
                          >
                            eBay
                          </Button>
                        )}
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<EmailIcon />}
                        href={generateSingleProductEmail(p)}
                        sx={{
                          fontWeight: 600,
                          textTransform: "none",
                        }}
                      >
                        Request Invoice
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        
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
    </ThemeProvider>
  );
};

export default Catalog;
