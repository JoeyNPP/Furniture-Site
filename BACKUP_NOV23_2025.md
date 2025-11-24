# NPP Deals System Backup - November 23, 2025

**Created:** Sunday, November 23, 2025 at 1:24 PM
**Purpose:** Full system backup before going live with catalog page updates

---

## Quick Restore Instructions

### Option 1: Git Restore (Recommended)
If you committed before this backup, you can restore using:
```bash
# See recent commits
git log --oneline -10

# Restore to a specific commit
git checkout <commit-hash> -- frontend/src/components/Catalog.js
git checkout <commit-hash> -- frontend/src/api.js
git checkout <commit-hash> -- frontend/src/theme.js
git checkout <commit-hash> -- frontend/src/App.js
git checkout <commit-hash> -- backend/main.py
```

### Option 2: Manual Restore from This Backup
1. Copy the code from the relevant section below
2. Replace the entire contents of the target file
3. Save the file
4. Restart the application

---

## File 1: frontend/src/components/Catalog.js

**Location:** `C:\Users\josep\projects\NPP_Deals\frontend\src\components\Catalog.js`

```javascript
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
    const options = [];
    for (let i = 1; i <= Math.min(maxMultiples, 10); i++) {
      options.push(moq * i);
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
                  height: { xs: 44, sm: 52, md: 64 },
                  maxWidth: "280px",
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
                mt: { xs: 0, md: "96px" },
                height: { xs: "100%", md: "calc(100vh - 96px)" },
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
                    <CardActions sx={{ px: 2, pb: 2, pt: 0, flexWrap: "wrap", gap: 0.5 }}>
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
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<EmailIcon />}
                        href={generateSingleProductEmail(p)}
                        sx={{
                          fontWeight: 600,
                          textTransform: "none",
                          ml: "auto",
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
```

---

## File 2: frontend/src/api.js

**Location:** `C:\Users\josep\projects\NPP_Deals\frontend\src\api.js`

```javascript
import jwtDecode from "jwt-decode"; // Compatible with jwt-decode@3.x

export const API_BASE_URL = "/api";

const withAuthHeaders = (token, extra = {}) => ({
  Authorization: `Bearer ${token}`,
  ...extra,
});

async function login(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ username, password }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Login failed for ${username}:`, error);
    throw error;
  }
}

function requireToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token not found");
  }
  return token;
}

async function fetchProducts() {
  const token = requireToken();
  try {
    const decodedToken = jwtDecode(token);
    console.debug("Fetching products with token exp:", decodedToken.exp);
    const response = await fetch(`${API_BASE_URL}/products`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch products error:", error);
    throw error;
  }
}

async function fetchPublicProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products/public`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch public products error:", error);
    throw error;
  }
}

async function createProduct(data) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Create product error:", error);
    throw error;
  }
}

async function updateProduct(id, data) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PATCH",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Update product error for ID ${id}:`, error);
    throw error;
  }
}

async function deleteProduct(id) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Delete product error for ID ${id}:`, error);
    throw error;
  }
}

async function markOutOfStock(id) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}/mark-out-of-stock`, {
      method: "POST",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Mark out-of-stock error for ID ${id}:`, error);
    throw error;
  }
}

async function uploadProducts(file) {
  const token = requireToken();
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE_URL}/products/import`, {
      method: "POST",
      headers: withAuthHeaders(token),
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Upload products error:", error);
    throw error;
  }
}

async function fetchProductsByCategory(category) {
  const token = localStorage.getItem("token");
  const headers = token ? withAuthHeaders(token) : {};
  try {
    const response = await fetch(`${API_BASE_URL}/products/category/${encodeURIComponent(category)}`, {
      headers,
    });
    if (!response.ok) {
      if (response.status === 404) {
        return { category, products: [] };
      }
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Fetch products by category failed for ${category}:`, error);
    throw error;
  }
}

async function searchProducts(query) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products/search?query=${encodeURIComponent(query)}`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Search products error for query '${query}':`, error);
    throw error;
  }
}

export async function fetchUserSettings() {
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/user/settings`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch user settings error:", error);
    return null;
  }
}

export async function persistUserSettings(nextSettings) {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }
  const options = {
    headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(nextSettings),
  };
  try {
    let response = await fetch(`${API_BASE_URL}/user/settings`, {
      method: "PATCH",
      ...options,
    });
    if (response.status === 404) {
      response = await fetch(`${API_BASE_URL}/user/settings`, {
        method: "POST",
        ...options,
      });
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error("Persist user settings error:", error);
  }
}

async function requestInvoice(customerInfo, productIds) {
  try {
    const response = await fetch(`${API_BASE_URL}/request-invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_company: customerInfo.company,
        customer_phone: customerInfo.phone,
        product_ids: productIds,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Request invoice error:", error);
    throw error;
  }
}

export {
  login,
  fetchProducts,
  fetchPublicProducts,
  fetchProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  markOutOfStock,
  searchProducts,
  uploadProducts,
  requestInvoice,
};
```

---

## File 3: frontend/src/theme.js

**Location:** `C:\Users\josep\projects\NPP_Deals\frontend\src\theme.js`

```javascript
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#003087" },
    secondary: { main: "#00A651" },
    success: { main: "#00A651" },
    warning: { main: "#FF6B00" },
    background: { default: "#F5F7FA" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h3: { fontWeight: 700 },
    h5: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          transition: "0.3s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
          },
        },
      },
    },
  },
});
```

---

## File 4: frontend/src/App.js

**Location:** `C:\Users\josep\projects\NPP_Deals\frontend\src\App.js`

```javascript
import React, { useContext, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./components/Login";
import InternalProductList from "./components/InternalProductList";
import CategoryPage from "./components/CategoryPage";
import Catalog from "./components/Catalog";
import { Box, CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SettingsContext } from "./settings/SettingsContext";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  const { settings } = useContext(SettingsContext);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: settings.darkMode ? "dark" : "light",
        },
      }),
    [settings.darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <InternalProductList />
              </ProtectedRoute>
            }
          />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Box>
    </ThemeProvider>
  );
}

export default App;
```

---

## File 5: backend/main.py

**Location:** `C:\Users\josep\projects\NPP_Deals\backend\main.py`

```python
import os
import csv
import io
import re
import unicodedata
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from datetime import datetime, timedelta
import jwt
import bcrypt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://159.65.184.143",
        "http://159.65.184.143:80",
        "http://159.65.184.143:3000",
        "http://localhost",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv('.env.local', override=True)  # Prefer .env.local for local testing
load_dotenv('.env')  # Fallback to .env for live

# Database connection
def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "npp_deals"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "26,Sheetpans!"),
        host=os.getenv("DB_HOST", "npp_deals-db"),
        port=os.getenv("DB_PORT", "5432"),
        cursor_factory=RealDictCursor
    )

# Create tables
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            title TEXT,
            category TEXT,
            vendor_id TEXT,
            vendor TEXT,
            price FLOAT,
            cost FLOAT,
            moq INTEGER,
            qty INTEGER,
            upc TEXT,
            asin TEXT,
            lead_time TEXT,
            exp_date TEXT,
            fob TEXT,
            image_url TEXT,
            out_of_stock BOOLEAN DEFAULT FALSE,
            amazon_url TEXT,
            walmart_url TEXT,
            ebay_url TEXT,
            offer_date TIMESTAMP,
            last_sent TIMESTAMP,
            sales_per_month INTEGER,
            net FLOAT,
            date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            username TEXT PRIMARY KEY,
            settings JSONB NOT NULL DEFAULT '{"theme": "light", "textScale": 1.0, "columnVisibility": {"title": true, "price": true}}'
        )
    """)
    # Ensure default users exist with shared credentials
    cur.execute("DELETE FROM users WHERE username = %s", ("joey/alex",))
    for username in ("joey", "alex"):
        cur.execute("""
            INSERT INTO users (username, password)
            VALUES (%s, %s)
            ON CONFLICT (username) DO NOTHING
        """, (
            username,
            bcrypt.hashpw("Winter2025$".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        ))
    conn.commit()
    cur.close()
    conn.close()

def normalize_category_value(value: Optional[str]) -> str:
    """Return a normalized key for category comparisons."""
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_only = ascii_only.replace("&", " and ")
    ascii_only = re.sub(r"[^\w\s]", " ", ascii_only)
    ascii_only = re.sub(r"\s+", " ", ascii_only)
    return ascii_only.strip().lower()


# Initialize database
init_db()

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "a-very-strong-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Root endpoint for healthcheck
@app.get("/")
async def root():
    return {"message": "NPP Deals Backend"}

# Pydantic models
class Product(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    vendor_id: Optional[str] = None
    vendor: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    moq: Optional[int] = None
    qty: Optional[int] = None
    upc: Optional[str] = None
    asin: Optional[str] = None
    lead_time: Optional[str] = None
    exp_date: Optional[str] = None
    fob: Optional[str] = None
    image_url: Optional[str] = None
    out_of_stock: Optional[bool] = False
    amazon_url: Optional[str] = None
    walmart_url: Optional[str] = None
    ebay_url: Optional[str] = None
    offer_date: Optional[datetime] = None
    last_sent: Optional[datetime] = None
    sales_per_month: Optional[int] = None
    net: Optional[float] = None

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    vendor_id: Optional[str] = None
    vendor: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    moq: Optional[int] = None
    qty: Optional[int] = None
    upc: Optional[str] = None
    asin: Optional[str] = None
    lead_time: Optional[str] = None
    exp_date: Optional[str] = None
    fob: Optional[str] = None
    image_url: Optional[str] = None
    out_of_stock: Optional[bool] = None
    amazon_url: Optional[str] = None
    walmart_url: Optional[str] = None
    ebay_url: Optional[str] = None
    offer_date: Optional[datetime] = None
    last_sent: Optional[datetime] = None
    sales_per_month: Optional[int] = None
    net: Optional[float] = None

class UserSettings(BaseModel):
    theme: Optional[str] = "light"
    textScale: Optional[float] = 1.0
    columnVisibility: Optional[dict] = {"title": True, "price": True}

# Authentication
def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    return username

@app.post("/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s", (form_data.username,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Product routes
@app.get("/products")
async def get_products(current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products ORDER BY date_added DESC")
    products = cur.fetchall()
    cur.close()
    conn.close()
    return {"products": products}

@app.get("/products/public")
async def get_public_products():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products WHERE out_of_stock = FALSE ORDER BY date_added DESC")
    products = cur.fetchall()
    cur.close()
    conn.close()
    return products

@app.get("/products/category/{category}")
async def get_products_by_category(category: str):
    normalized_query = normalize_category_value(category)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT title, price, COALESCE(image_url, '') AS image_url, category
        FROM products
        WHERE category IS NOT NULL
        ORDER BY title ASC
        """
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    filtered = [
        row for row in rows
        if normalize_category_value(row.get("category")) == normalized_query
    ]
    if not filtered:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No products found in category {category}",
        )

    display_category = (filtered[0].get("category") or category).strip()

    simplified = [
        {
            "title": row.get("title"),
            "price": row.get("price"),
            "image_url": row.get("image_url") or "https://via.placeholder.com/150",
        }
        for row in filtered
    ]
    return {"category": display_category, "products": simplified}

@app.post("/products")
async def create_product(product: Product, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO products (
          title, category, vendor_id, vendor, price, cost, moq, qty, upc, asin, lead_time,
          exp_date, fob, image_url, out_of_stock, amazon_url, walmart_url, ebay_url, offer_date,
          last_sent, sales_per_month, net, date_added
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """, (
            product.title, product.category, product.vendor_id, product.vendor, product.price, product.cost,
            product.moq, product.qty, product.upc, product.asin, product.lead_time, product.exp_date, product.fob,
            product.image_url, product.out_of_stock, product.amazon_url, product.walmart_url, product.ebay_url,
            product.offer_date, product.last_sent, product.sales_per_month, product.net,
            datetime.now()
        ))
    product_id = cur.fetchone()['id']
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product created successfully", "product_id": product_id}

@app.patch("/products/{id}")
async def update_product(id: int, product: ProductUpdate, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    update_fields = []
    values = []
    if product.title is not None:
        update_fields.append("title = %s")
        values.append(product.title)
    if product.category is not None:
        update_fields.append("category = %s")
        values.append(product.category)
    if product.vendor_id is not None:
        update_fields.append("vendor_id = %s")
        values.append(product.vendor_id)
    if product.vendor is not None:
        update_fields.append("vendor = %s")
        values.append(product.vendor)
    if product.price is not None:
        update_fields.append("price = %s")
        values.append(product.price)
    if product.cost is not None:
        update_fields.append("cost = %s")
        values.append(product.cost)
    if product.moq is not None:
        update_fields.append("moq = %s")
        values.append(product.moq)
    if product.qty is not None:
        update_fields.append("qty = %s")
        values.append(product.qty)
    if product.upc is not None:
        update_fields.append("upc = %s")
        values.append(product.upc)
    if product.asin is not None:
        update_fields.append("asin = %s")
        values.append(product.asin)
    if product.lead_time is not None:
        update_fields.append("lead_time = %s")
        values.append(product.lead_time)
    if product.exp_date is not None:
        update_fields.append("exp_date = %s")
        values.append(product.exp_date)
    if product.fob is not None:
        update_fields.append("fob = %s")
        values.append(product.fob)
    if product.image_url is not None:
        update_fields.append("image_url = %s")
        values.append(product.image_url)
    if product.out_of_stock is not None:
        update_fields.append("out_of_stock = %s")
        values.append(product.out_of_stock)
    if product.amazon_url is not None:
        update_fields.append("amazon_url = %s")
        values.append(product.amazon_url)
    if product.walmart_url is not None:
        update_fields.append("walmart_url = %s")
        values.append(product.walmart_url)
    if product.ebay_url is not None:
        update_fields.append("ebay_url = %s")
        values.append(product.ebay_url)
    if product.offer_date is not None:
        update_fields.append("offer_date = %s")
        values.append(product.offer_date)
    if product.last_sent is not None:
        update_fields.append("last_sent = %s")
        values.append(product.last_sent)
    if product.sales_per_month is not None:
        update_fields.append("sales_per_month = %s")
        values.append(product.sales_per_month)
    if product.net is not None:
        update_fields.append("net = %s")
        values.append(product.net)
    if not update_fields:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="No fields to update")
    values.append(id)
    query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = %s"
    cur.execute(query, values)
    if cur.rowcount == 0:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product updated successfully"}

@app.delete("/products/{id}")
async def delete_product(id: int, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM products WHERE id = %s", (id,))
    if cur.rowcount == 0:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product deleted successfully"}

@app.post("/products/{id}/mark-out-of-stock")
async def mark_product_out_of_stock(id: int, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE products SET out_of_stock = true WHERE id = %s", (id,))
    if cur.rowcount == 0:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product marked as out-of-stock"}

@app.get("/products/search")
async def search_products(query: str, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    search_query = f"%{query}%"
    cur.execute("""
        SELECT * FROM products
        WHERE title ILIKE %s
        OR category ILIKE %s
        OR vendor ILIKE %s
        OR upc ILIKE %s
        OR asin ILIKE %s
        ORDER BY date_added DESC
    """, (search_query, search_query, search_query, search_query, search_query))
    products = cur.fetchall()
    cur.close()
    conn.close()
    return {"products": products}

@app.post("/products/import")
async def import_products(file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    try:
        text = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = contents.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="CSV file is missing headers")
    field_map = {
        "date": "offer_date",
        "amazon url": "amazon_url",
        "asin": "asin",
        "price": "price",
        "moq": "moq",
        "qty": "qty",
        "upc": "upc",
        "cost": "cost",
        "vendor": "vendor",
        "lead time": "lead_time",
        "exp date": "exp_date",
        "fob": "fob",
        "vendor id": "vendor_id",
        "image url": "image_url",
        "title": "title",
        "category": "category",
        "walmart url": "walmart_url",
        "ebay url": "ebay_url",
        "sales per month": "sales_per_month",
        "net": "net"
    }
    float_fields = {"price", "cost", "net", "sales_per_month"}
    int_fields = {"moq", "qty"}
    conn = get_db_connection()
    cur = conn.cursor()
    inserted = updated = skipped = 0
    for raw_row in reader:
        row = {(key or "").strip(): (value or "").strip() for key, value in raw_row.items()}
        normalized = {key.lower(): value for key, value in row.items() if key}
        asin_value = normalized.get("asin") or None
        title_value = normalized.get("title") or None
        if not asin_value and not title_value:
            skipped += 1
            continue
        record = {}
        for header, column in field_map.items():
            value = normalized.get(header)
            if value in (None, ""):
                continue
            if column in float_fields:
                try:
                    record[column] = float(value.replace(",", ""))
                except ValueError:
                    continue
            elif column in int_fields:
                try:
                    record[column] = int(float(value.replace(",", "")))
                except ValueError:
                    continue
            elif column == "offer_date":
                parsed = None
                for pattern in ("%m/%d/%Y", "%Y-%m-%d", "%m-%d-%Y"):
                    try:
                        parsed = datetime.strptime(value, pattern)
                        break
                    except ValueError:
                        continue
                if parsed:
                    record[column] = parsed
            else:
                record[column] = value
        product_id = None
        if asin_value:
            cur.execute("SELECT id FROM products WHERE asin = %s", (asin_value,))
            match = cur.fetchone()
            if match:
                product_id = match["id"]
        if product_id is None and title_value:
            cur.execute("SELECT id FROM products WHERE title = %s", (title_value,))
            match = cur.fetchone()
            if match:
                product_id = match["id"]
        if product_id:
            if record:
                update_fields = []
                values = []
                for column, value in record.items():
                    update_fields.append(f"{column} = %s")
                    values.append(value)
                values.append(product_id)
                cur.execute(
                    f"UPDATE products SET {', '.join(update_fields)} WHERE id = %s",
                    values
                )
                updated += 1
            else:
                skipped += 1
        else:
            if record:
                columns = list(record.keys())
                placeholders = ["%s"] * len(columns)
                values = [record[column] for column in columns]
                columns.append("date_added")
                placeholders.append("%s")
                values.append(datetime.now())
                cur.execute(
                    f"INSERT INTO products ({', '.join(columns)}) VALUES ({', '.join(placeholders)})",
                    values
                )
                inserted += 1
            else:
                skipped += 1
    conn.commit()
    cur.close()
    conn.close()
    return {"inserted": inserted, "updated": updated, "skipped": skipped}

class UserSettings(BaseModel):
    theme: Optional[str] = "light"
    textScale: Optional[float] = 1.0
    columnVisibility: Optional[dict] = {"title": True, "price": True}

@app.get("/user/settings")
async def get_user_settings(current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT settings FROM user_settings WHERE username = %s", (current_user,))
    settings = cur.fetchone()
    cur.close()
    conn.close()
    if settings and "settings" in settings:
        return settings["settings"]
    return {"theme": "light", "textScale": 1.0, "columnVisibility": {"title": True, "price": True}}

@app.patch("/user/settings")
async def update_user_settings(settings: UserSettings, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO user_settings (username, settings)
        VALUES (%s, %s)
        ON CONFLICT (username) DO UPDATE SET settings = EXCLUDED.settings
    """, (current_user, Json(settings.dict())))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Settings updated", "settings": settings.dict()}

@app.post("/user/settings")
async def create_user_settings(settings: UserSettings, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO user_settings (username, settings) VALUES (%s, %s) ON CONFLICT (username) DO NOTHING", (current_user, Json(settings.dict())))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Settings created", "settings": settings.dict()}


# Invoice Request Models and Endpoint
class InvoiceRequest(BaseModel):
    customer_name: str
    customer_email: str
    customer_company: Optional[str] = None
    customer_phone: Optional[str] = None
    product_ids: List[int]


def send_invoice_email(customer_info: dict, products: list):
    """Send invoice request email to NPP sales team."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    recipient_email = os.getenv("INVOICE_RECIPIENT", "sales@nppwholesale.com")

    if not smtp_user or not smtp_pass:
        print("SMTP credentials not configured, skipping email")
        return False

    # Build product table HTML
    product_rows = ""
    for p in products:
        product_rows += f"""
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">{p.get('title', 'N/A')}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{p.get('vendor', 'N/A')}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${p.get('price', 0):.2f}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{p.get('moq', 'N/A')}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{p.get('qty', 0)}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{p.get('fob', 'N/A')}</td>
        </tr>
        """

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="background: #003087; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">New Invoice Request</h1>
        </div>
        <div style="padding: 20px;">
            <h2 style="color: #003087;">Customer Information</h2>
            <table style="width: 100%; margin-bottom: 20px;">
                <tr><td><strong>Name:</strong></td><td>{customer_info.get('name', 'N/A')}</td></tr>
                <tr><td><strong>Email:</strong></td><td>{customer_info.get('email', 'N/A')}</td></tr>
                <tr><td><strong>Company:</strong></td><td>{customer_info.get('company', 'N/A')}</td></tr>
                <tr><td><strong>Phone:</strong></td><td>{customer_info.get('phone', 'N/A')}</td></tr>
            </table>

            <h2 style="color: #003087;">Requested Products ({len(products)} items)</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #003087; color: white;">
                        <th style="padding: 10px; text-align: left;">Product</th>
                        <th style="padding: 10px; text-align: left;">Vendor</th>
                        <th style="padding: 10px; text-align: left;">Price</th>
                        <th style="padding: 10px; text-align: left;">MOQ</th>
                        <th style="padding: 10px; text-align: left;">In Stock</th>
                        <th style="padding: 10px; text-align: left;">FOB</th>
                    </tr>
                </thead>
                <tbody>
                    {product_rows}
                </tbody>
            </table>

            <p style="color: #666; font-size: 12px;">
                This request was submitted on {datetime.now().strftime('%B %d, %Y at %I:%M %p')} via the NPP Live Catalog.
            </p>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Invoice Request from {customer_info.get('name', 'Customer')} - {len(products)} Products"
    msg["From"] = smtp_user
    msg["To"] = recipient_email
    msg["Reply-To"] = customer_info.get('email', smtp_user)

    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, [recipient_email], msg.as_string())
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


@app.post("/request-invoice")
async def request_invoice(request: InvoiceRequest):
    if not request.product_ids:
        raise HTTPException(status_code=400, detail="No products selected")

    conn = get_db_connection()
    cur = conn.cursor()

    # Fetch the requested products
    placeholders = ','.join(['%s'] * len(request.product_ids))
    cur.execute(f"SELECT * FROM products WHERE id IN ({placeholders})", request.product_ids)
    products = cur.fetchall()
    cur.close()
    conn.close()

    if not products:
        raise HTTPException(status_code=404, detail="No products found")

    customer_info = {
        "name": request.customer_name,
        "email": request.customer_email,
        "company": request.customer_company or "Not provided",
        "phone": request.customer_phone or "Not provided",
    }

    # Send email
    email_sent = send_invoice_email(customer_info, products)

    return {
        "message": "Invoice request submitted successfully",
        "products_count": len(products),
        "email_sent": email_sent,
    }
```

---

## Current System Features (as of this backup)

### Catalog Page Features:
1. **Header**: NPP logo on left, "LIVE CATALOG" centered, Request Invoice button on right
2. **Filters**: Deal Cost presets, Marketplace (Amazon/Walmart/eBay), Categories, FOB Ports, In Stock Only
3. **Sorting**: 8 options (Newest, Oldest, Price, Deal Cost, MOQ - both directions)
4. **Search**: By title, ASIN, or UPC only (vendor excluded - internal data)
5. **Product Cards**: Image, title, ASIN, UPC, price, MOQ, stock qty, FOB, deal cost chip, lead time, exp date
6. **Invoice System**: Email-based (mailto:) - single product or multi-select with MOQ multiples
7. **Color-coded Buttons**: Amazon (orange), Walmart (blue), eBay (red)
8. **Responsive Design**: Mobile drawer menu, desktop permanent sidebar (320px)

### Routes:
- `/login` - Login page
- `/catalog` - Public catalog (no auth required)
- `/products` - Internal product list (auth required)
- `/category/:category` - Category page

---

## Notes
- Logo file location: `frontend/public/assets/logo.png`
- Email sent to: `sales@nat-procurement.com`
- NPP navy blue: `#003087`
- NPP green: `#00A651`
