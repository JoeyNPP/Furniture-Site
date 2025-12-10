import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Drawer,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  TextField,
  IconButton,
  CircularProgress,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsDialog from "./SettingsDialog";
import ProductFormDialog from "./ProductFormDialog";
import CustomizeColumnsDialog from "./CustomizeColumnsDialog";
import VendorPerformance from "./VendorPerformance";
import { fetchProducts, createProduct, updateProduct, deleteProduct, markOutOfStock, searchProducts, uploadProducts } from "../api";
import { sendIndividualEmails, sendGroupEmail } from "../emailSender";
import * as XLSX from "xlsx";
import jwtDecode from "jwt-decode";
import { SettingsContext } from "../settings/SettingsContext";

const DEFAULT_DOWNLOAD_COLUMNS = [
  "title",
  "amazon_url",
  "asin",
  "price",
  "moq",
  "qty",
  "upc",
  "lead_time",
  "fob",
  "walmart_url",
];

const BULK_EDITABLE_FIELDS = [
  { value: "title", label: "Title" },
  { value: "category", label: "Category" },
  { value: "vendor", label: "Vendor" },
  { value: "vendor_id", label: "Vendor ID" },
  { value: "lead_time", label: "Lead Time" },
  { value: "exp_date", label: "Expiration Date" },
  { value: "fob", label: "FOB" },
  { value: "price", label: "Price" },
  { value: "cost", label: "Cost" },
  { value: "moq", label: "MOQ" },
  { value: "qty", label: "Quantity" },
  { value: "sales_per_month", label: "Sales Per Month" },
  { value: "net", label: "Net" },
  { value: "offer_date", label: "Offer Date" },
  { value: "out_of_stock", label: "Out of Stock (true/false)" },
  { value: "amazon_url", label: "Amazon URL" },
  { value: "walmart_url", label: "Walmart URL" },
  { value: "ebay_url", label: "eBay URL" },
  { value: "image_url", label: "Image URL" },
];

const INTEGER_FIELDS = new Set(["moq", "qty", "sales_per_month"]);
const DECIMAL_FIELDS = new Set(["price", "cost", "net"]);

const sanitizeDownloadSelection = (fields, allowedFields) =>
  allowedFields.filter((field) => fields.includes(field));

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (
    stringValue.includes("\"") ||
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const InternalProductList = ({ onBack }) => {
  const fileInputRef = useRef(null);
  const { settings, updateSettings } = useContext(SettingsContext);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showVendorPerformance, setShowVendorPerformance] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("in");
  const [dealCostRange, setDealCostRange] = useState([0, Infinity]);
  const [expirationFilter, setExpirationFilter] = useState("all"); // all, expiring, expired

  // Deal Cost presets (matching catalog)
  const dealCostPresets = [
    { label: "All Deals", range: [0, Infinity] },
    { label: "$0-$1K", range: [0, 1000] },
    { label: "$1K-$3K", range: [1000, 3000] },
    { label: "$3K-$5K", range: [3000, 5000] },
    { label: "$5K-$10K", range: [5000, 10000] },
    { label: "$10K+", range: [10000, Infinity] },
  ];
  const [pageSize, setPageSize] = useState(50);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState(settings.columnVisibility || {});
  const [sortModel, setSortModel] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customizeDialogOpen, setCustomizeDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditField, setBulkEditField] = useState("");
  const [bulkEditValue, setBulkEditValue] = useState("");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadSelectedColumns, setDownloadSelectedColumns] = useState(DEFAULT_DOWNLOAD_COLUMNS);
  const [loading, setLoading] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const bulkEditableFields = BULK_EDITABLE_FIELDS;
  const integerFields = INTEGER_FIELDS;
  const decimalFields = DECIMAL_FIELDS;
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const drawerWidth = isMobile ? 150 : 200;
  const timezone = "America/New_York";

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadProducts(file);
      alert(`Import complete: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`);
      await loadProducts();
    } catch (error) {
      console.error("Upload products error:", error);
      alert(`Failed to import products: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const decodedToken = jwtDecode(token);
      const expirationTime = decodedToken.exp * 1000;
      const currentTime = Date.now();
      if (expirationTime < currentTime) {
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiration");
        navigate("/login");
        return;
      }
      localStorage.setItem("tokenExpiration", expirationTime);
      loadProducts();
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiration");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const savedSortModel = localStorage.getItem("sortModel");
    if (savedSortModel) {
      setSortModel(JSON.parse(savedSortModel));
    } else {
      const defaultSortModel = [{ field: "offer_date", sort: "desc" }];
      setSortModel(defaultSortModel);
      localStorage.setItem("sortModel", JSON.stringify(defaultSortModel));
    }
  }, []);

  useEffect(() => {
    localStorage.removeItem("columnVisibilityModel");
    const defaultModel = {};
    baseColumns.forEach((col) => {
      defaultModel[col.field] = true;
    });
    setColumnVisibilityModel(settings.columnVisibility || defaultModel);
    localStorage.setItem("columnVisibilityModel", JSON.stringify(settings.columnVisibility || defaultModel));
  }, [settings.columnVisibility]);

  async function loadProducts() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching products with token:", token);
      const response = await fetchProducts();
      console.log("Products fetched successfully:", response);
      const productData = Array.isArray(response.products) ? response.products : Array.isArray(response) ? response : [];
      if (!Array.isArray(productData)) {
        console.error("Product data is not an array:", productData);
        setProducts([]);
        setFilteredProducts([]);
        return;
      }
      setProducts(productData);
      setFilteredProducts(productData.filter((p) => p.out_of_stock === false));
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setFilteredProducts([]);
      if (error.message.includes("401")) {
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiration");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (searchQuery.trim() === "") {
      applyFilters();
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const searchedProducts = products.filter((product) =>
        Object.values(product).some(
          (value) =>
            value !== null &&
            value !== undefined &&
            value.toString().toLowerCase().includes(lowerQuery)
        )
      );
      setFilteredProducts(searchedProducts);
    }
  }, [searchQuery, products]);

  const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);
    updateSettings({ ...settings, columnVisibility: newModel });
    localStorage.setItem("columnVisibilityModel", JSON.stringify(newModel));
  };

  const handleSortModelChange = (newSortModel) => {
    setSortModel(newSortModel);
    localStorage.setItem("sortModel", JSON.stringify(newSortModel));
  };

  // Helper to calculate deal cost (matching catalog)
  const getDealCost = (p) => {
    const price = parseFloat(p.price) || 0;
    const moq = parseInt(p.moq, 10) || 0;
    if (!price || !moq) return null;
    return price * moq;
  };

  // Helper to parse expiration date (format: "6/27" means June 2027)
  const parseExpDate = (exp_date) => {
    if (!exp_date || typeof exp_date !== 'string') return null;
    const parts = exp_date.trim().split('/');
    if (parts.length !== 2) return null;
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    if (isNaN(month) || isNaN(year)) return null;
    // If year is 2 digits, assume 20XX
    const fullYear = year < 100 ? 2000 + year : year;
    // Create date at end of month
    return new Date(fullYear, month, 0); // Day 0 = last day of previous month
  };

  // Helper to get expiration status
  const getExpirationStatus = (exp_date) => {
    const expDate = parseExpDate(exp_date);
    if (!expDate) return null;

    const now = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(now.getMonth() + 6);

    if (expDate < now) {
      return 'expired'; // Red
    } else if (expDate < sixMonthsFromNow) {
      return 'expiring-soon'; // Yellow
    }
    return 'valid'; // No badge
  };

  const applyFilters = () => {
    let temp = [...products];
    if (categoryFilter) {
      temp = temp.filter(
        (p) => (p.category || "").toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    if (vendorFilter) {
      temp = temp.filter(
        (p) => (p.vendor || "").toLowerCase() === vendorFilter.toLowerCase()
      );
    }
    if (stockFilter === "in") {
      temp = temp.filter((p) => p.out_of_stock === false);
    } else if (stockFilter === "out") {
      temp = temp.filter((p) => p.out_of_stock === true);
    }
    // Deal Cost filter
    if (dealCostRange[0] > 0 || dealCostRange[1] < Infinity) {
      temp = temp.filter((p) => {
        const dealCost = getDealCost(p);
        if (dealCost === null) return false;
        return dealCost >= dealCostRange[0] && dealCost <= dealCostRange[1];
      });
    }
    // Expiration filter
    if (expirationFilter === "expiring") {
      temp = temp.filter((p) => getExpirationStatus(p.exp_date) === "expiring-soon");
    } else if (expirationFilter === "expired") {
      temp = temp.filter((p) => getExpirationStatus(p.exp_date) === "expired");
    }
    setFilteredProducts(temp);
  };

  const resetFilters = () => {
    setCategoryFilter("");
    setVendorFilter("");
    setStockFilter("in");
    setDealCostRange([0, Infinity]);
    setExpirationFilter("all");
    setFilteredProducts(products.filter((p) => p.out_of_stock === false));
  };

  const handleSelectionModelChange = (newSelection) => {
    setSelectedIds(newSelection);
  };

  const formatProductForWhatsApp = (product) => {
    const lines = [];

    // Amazon URL (required)
    if (product.amazon_url) {
      lines.push(product.amazon_url);
    }

    // Price (required)
    if (product.price) {
      lines.push(`$${product.price}`);
    }

    // MOQ and QTY logic
    const hasMOQ = product.moq && product.moq > 0;
    const hasQTY = product.qty && product.qty > 0;

    if (hasMOQ && hasQTY) {
      // Both MOQ and QTY available
      lines.push(`MOQ ${product.moq}`);
      lines.push(`QTY ${product.qty}`);
    } else if (hasQTY && !hasMOQ) {
      // Only QTY - show as "take all"
      lines.push(`${product.qty} take all`);
    } else if (hasMOQ && !hasQTY) {
      // Only MOQ
      lines.push(`MOQ ${product.moq}`);
    }

    // UPC
    if (product.upc) {
      lines.push(`UPC: ${product.upc}`);
    }

    // Exp Date
    if (product.exp_date) {
      lines.push(`Exp Date: ${product.exp_date}`);
    }

    // FOB
    if (product.fob) {
      lines.push(`FOB: ${product.fob}`);
    }

    // Lead Time
    if (product.lead_time) {
      lines.push(product.lead_time);
    }

    return lines.join('\n');
  };

  const handleSendWhatsApp = () => {
    const selectedProducts = filteredProducts.filter((p) =>
      selectedIds.includes(String(p.id))
    );
    if (!selectedProducts.length) {
      alert("No products selected for WhatsApp.");
      return;
    }

    // Format all selected products
    const formattedProducts = selectedProducts.map(formatProductForWhatsApp);
    const whatsappMessage = formattedProducts.join('\n\n');

    // Copy to clipboard
    navigator.clipboard.writeText(whatsappMessage).then(() => {
      alert(`Copied ${selectedProducts.length} product(s) to clipboard!\n\nYou can now paste this into WhatsApp.`);
    }).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
      // Fallback: show the text in an alert
      alert('Message formatted for WhatsApp:\n\n' + whatsappMessage);
    });
  };

  const handleSendGroupEmail = async () => {
    const selectedProducts = filteredProducts.filter((p) =>
      selectedIds.includes(String(p.id))
    );
    if (!selectedProducts.length) {
      alert("No products selected for group email.");
      return;
    }
    await sendGroupEmail(selectedProducts);
    loadProducts();
  };

  const handleAddClick = () => {
    setDialogMode("add");
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  const handleEditClick = (product) => {
    setDialogMode("edit");
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, navigating to login");
      navigate("/login");
      return;
    }
    try {
      const decodedToken = jwtDecode(token);
      const expirationTime = decodedToken.exp * 1000;
      const currentTime = Date.now();
      if (expirationTime < currentTime) {
        console.log("Token expired, navigating to login");
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiration");
        navigate("/login");
        return;
      }
      console.log("Submitting form data:", formData);
      const updatedFormData = {
        ...formData,
        title: formData.title || "Untitled",
        offer_date: formData.offer_date && formData.offer_date.trim() !== "" ? formData.offer_date : null,
        last_sent: formData.last_sent && formData.last_sent.trim() !== "" ? formData.last_sent : null,
        vendor_id: formData.vendor_id || "",
        price: formData.price ? parseFloat(formData.price) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        moq: formData.moq ? parseInt(formData.moq, 10) : null,
        qty: formData.qty ? parseInt(formData.qty, 10) : null,
        sales_per_month: formData.sales_per_month ? parseInt(formData.sales_per_month, 10) : null,
        net: formData.net ? parseFloat(formData.net) : null,
      };
      console.log("Prepared API payload:", updatedFormData);
      if (dialogMode === "add") {
        console.log("Creating product with data:", updatedFormData);
        const response = await createProduct(updatedFormData);
        console.log("Create product response:", response);
        localStorage.removeItem("productFormData");
      } else {
        if (!selectedProduct?.id) {
          console.error("No product ID to update");
          return;
        }
        console.log("Updating product ID:", selectedProduct.id, "with data:", updatedFormData);
        const response = await updateProduct(selectedProduct.id, updatedFormData);
        console.log("Update product response:", response);
        localStorage.removeItem("productFormData");
      }
      setDialogOpen(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (error) {
      console.error("Form submission error:", error);
      if (error.message.includes("401")) {
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiration");
        navigate("/login");
      } else {
        alert("Failed to save product: " + error.message);
      }
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedProduct(null);
    localStorage.removeItem("productFormData");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        alert("Product deleted successfully");
        loadProducts();
      } catch (error) {
        alert("Failed to delete product");
      }
    }
  };

  const handleMarkOutOfStock = async (id) => {
    if (window.confirm("Mark this product as out-of-stock?")) {
      try {
        await markOutOfStock(id);
        alert("Product marked as out-of-stock");
        loadProducts();
      } catch (error) {
        alert("Failed to mark product as out-of-stock");
      }
    }
  };

  const handleDownloadInventory = () => {
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
    const inStockProducts = products.filter((p) => p.out_of_stock === false);
    const recentInStockProducts = inStockProducts.filter((product) => {
      const offerDate = product.offer_date ? new Date(product.offer_date) : new Date(0);
      const formattedOfferDate = offerDate.toLocaleString('en-US', { timeZone: timezone });
      console.log("Checking product:", product.title, "Offer Date:", product.offer_date, "Formatted:", formattedOfferDate, "In Stock:", !product.out_of_stock);
      return offerDate >= sixWeeksAgo && !isNaN(offerDate.getTime());
    });
    const sortedProducts = [...recentInStockProducts].sort((a, b) => {
      const dateA = a.offer_date ? new Date(a.offer_date) : new Date(0);
      const dateB = b.offer_date ? new Date(b.offer_date) : new Date(0);
      return dateB - dateA;
    });
    const groupedByDate = {};
    sortedProducts.forEach((product) => {
      const date = product.offer_date
        ? new Date(product.offer_date).toLocaleString('en-US', { timeZone: timezone }).split(',')[0]
        : "No Date";
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(product);
    });
    const data = [];
    data.push(["Unnamed: 0", ".1", ".2", ".3", ".4", "Unnamed: 6", "Unnamed: 7", "Unnamed: 8", "Unnamed: 9", "Unnamed: 10", "Unnamed: 11", "Unnamed: 12", "Unnamed: 13"]);
    data.push([
      "For sales inquiries please email sales@nat-procurement.com",
      "Strong Asin",
      "Price",
      "MOQ",
      "QTY",
      "UPC/NOTE",
      "Lead Time",
      "Exp Date",
      "FOB",
      "Walmart URL",
      "EBAY URL",
      "Sales Per Month"
    ]);
    Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a)).forEach((date) => {
      data.push([date]);
      groupedByDate[date].forEach((product) => {
        data.push([
          product.amazon_url || "",
          product.asin || "",
          product.price || "",
          product.moq || "",
          product.qty || "",
          product.upc || "",
          product.lead_time || "",
          product.exp_date || "",
          product.fob || "",
          product.walmart_url || "",
          product.ebay_url || "",
          product.sales_per_month || ""
        ]);
      });
    });
    data.push([]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { name: ["Arial", "Calibri"], sz: 14, bold: true },
          alignment: {
            vertical: "center",
            horizontal: (C === 0 || C === 9 || C === 10) ? "left" : "center"
          }
        };
      }
    }
    const logoUrl = "http://104.131.49.141:3000/assets/logo.png";
    fetch(logoUrl)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          ws["!images"] = [{
            name: "logo.png",
            data: base64data,
            opts: { base64: true },
            position: {
              type: "twoCellAnchor",
              attrs: { editAs: "absolute" },
              from: { col: 0, row: 0 },
              to: { col: 2, row: 2 }
            }
          }];
          ws["!cols"] = [
            { wch: 50 },
            { wch: 15 },
            { wch: 10 },
            { wch: 10 },
            { wch: 10 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 10 },
            { wch: 50 },
            { wch: 50 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 }
          ];
          XLSX.utils.book_append_sheet(wb, ws, "Inventory");
          XLSX.writeFile(wb, `inventory_${new Date().toLocaleString('en-US', { timeZone: timezone }).split(',')[0].replace(/\//g, '-')}.xlsx`, { compression: true });
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error("Error loading logo:", error);
        XLSX.utils.book_append_sheet(wb, ws, "Inventory");
        XLSX.writeFile(wb, `inventory_${new Date().toLocaleString('en-US', { timeZone: timezone }).split(',')[0].replace(/\//g, '-')}.xlsx`, { compression: true });
      });
  };

  const baseColumns = [
    { field: "title", headerName: "Title", width: 200 * (settings.textScale || 1) },
    { field: "category", headerName: "Category", width: 200 * (settings.textScale || 1) },
    { field: "vendor_id", headerName: "Vendor ID", width: 120 * (settings.textScale || 1) },
    { field: "vendor", headerName: "Vendor", width: 150 * (settings.textScale || 1) },
    { field: "price", headerName: "Price", width: 100 * (settings.textScale || 1), type: "number" },
    { field: "cost", headerName: "Cost", width: 100 * (settings.textScale || 1), type: "number" },
    { field: "moq", headerName: "MOQ", width: 100 * (settings.textScale || 1), type: "number" },
    { field: "qty", headerName: "Qty", width: 100 * (settings.textScale || 1), type: "number" },
    { field: "upc", headerName: "UPC", width: 120 * (settings.textScale || 1) },
    { field: "asin", headerName: "ASIN", width: 120 * (settings.textScale || 1) },
    { field: "lead_time", headerName: "Lead Time", width: 120 * (settings.textScale || 1) },
    {
      field: "exp_date",
      headerName: "Exp Date",
      width: 150 * (settings.textScale || 1),
      renderCell: (params) => {
        const status = getExpirationStatus(params.value);
        if (!status || status === 'valid') {
          return params.value || '';
        }
        const bgColor = status === 'expired' ? '#ffebee' : '#fff9c4';
        const textColor = status === 'expired' ? '#c62828' : '#f57f17';
        const label = status === 'expired' ? 'EXPIRED' : 'EXPIRING SOON';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>{params.value}</span>
            <Box
              sx={{
                bgcolor: bgColor,
                color: textColor,
                px: 0.8,
                py: 0.3,
                borderRadius: 1,
                fontSize: '0.7em',
                fontWeight: 600
              }}
            >
              {label}
            </Box>
          </Box>
        );
      }
    },
    { field: "fob", headerName: "FOB", width: 100 * (settings.textScale || 1) },
    { field: "image_url", headerName: "Image URL", width: 200 * (settings.textScale || 1) },
    { field: "out_of_stock", headerName: "Out of Stock", width: 110 * (settings.textScale || 1), type: "boolean" },
    { field: "amazon_url", headerName: "Amazon URL", width: 200 * (settings.textScale || 1) },
    { field: "walmart_url", headerName: "Walmart URL", width: 200 * (settings.textScale || 1) },
    { field: "ebay_url", headerName: "eBay URL", width: 200 * (settings.textScale || 1) },
    {
      field: "offer_date",
      headerName: "Offer Date",
      width: 180 * (settings.textScale || 1),
      valueFormatter: (params) =>
        params.value
          ? new Date(params.value).toLocaleString('en-US', { timeZone: timezone })
          : "",
    },
    {
      field: "last_sent",
      headerName: "Last Sent",
      width: 180 * (settings.textScale || 1),
      valueFormatter: (params) =>
        params.value
          ? new Date(params.value).toLocaleString('en-US', { timeZone: timezone })
          : "",
    },
    {
      field: "customer_cost",
      headerName: "Customer Cost per MOQ",
      width: 180 * (settings.textScale || 1),
      valueGetter: (params) => {
        const price = Number(params.row.price);
        const moq = Number(params.row.moq);
        if (!isNaN(price) && !isNaN(moq)) {
          return price * moq;
        }
        return "";
      },
    },
    {
      field: "profit_per_moq",
      headerName: "Profit per MOQ",
      width: 180 * (settings.textScale || 1),
      valueGetter: (params) => {
        const price = Number(params.row.price);
        const cost = Number(params.row.cost);
        const moq = Number(params.row.moq);
        if (!isNaN(price) && !isNaN(cost) && !isNaN(moq)) {
          return (price - cost) * moq;
        }
        return "";
      },
    },
    {
      field: "sales_per_month",
      headerName: "Sales Per Month",
      width: 150 * (settings.textScale || 1),
      type: "number",
    },
    {
      field: "net",
      headerName: "Net",
      width: 150 * (settings.textScale || 1),
      type: "number",
    },
    {
      field: "roi",
      headerName: "ROI (%)",
      width: 150 * (settings.textScale || 1),
      type: "number",
      valueGetter: (params) => {
        const net = Number(params.row.net);
        const price = Number(params.row.price);
        if (!isNaN(net) && !isNaN(price) && price !== 0) {
          return (net / price) * 100;
        }
        return "";
      },
      valueFormatter: (params) => (params.value ? `${params.value.toFixed(2)}%` : ""),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 250 * (settings.textScale || 1),
      sortable: false,
      renderCell: (params) => {
        const handleEdit = (e) => {
          e.stopPropagation();
          handleEditClick(params.row);
        };
        const handleDeleteClick = async (e) => {
          e.stopPropagation();
          await handleDelete(params.row.id);
        };
        const handleMarkOut = async (e) => {
          e.stopPropagation();
          await handleMarkOutOfStock(params.row.id);
        };
        return (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" onClick={handleEdit}>
              Edit
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
            {!params.row.out_of_stock && (
              <Button
                variant="outlined"
                size="small"
                color="warning"
                onClick={handleMarkOut}
              >
                Out of Stock
              </Button>
            )}
          </Stack>
        );
      },
    },
  ];

  const columns = baseColumns.map((col) => {
    if (col.field === "actions") {
      return {
        ...col,
        renderCell: (params) => {
          const handleEdit = (e) => {
            e.stopPropagation();
            handleEditClick(params.row);
          };
          const handleDeleteClick = async (e) => {
            e.stopPropagation();
            await handleDelete(params.row.id);
          };
          const handleMarkOut = async (e) => {
            e.stopPropagation();
            await handleMarkOutOfStock(params.row.id);
          };
          return (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" size="small" onClick={handleEdit}>
                Edit
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={handleDeleteClick}
              >
                Delete
              </Button>
              {!params.row.out_of_stock && (
                <Button
                  variant="outlined"
                  size="small"
                  color="warning"
                  onClick={handleMarkOut}
                >
                  Out of Stock
                </Button>
              )}
            </Stack>
          );
        },
      };
    }
    return { ...col, width: col.width };
  });

  const downloadableColumnOptions = baseColumns
    .filter((column) => column.field !== "actions")
    .map((column) => ({
      field: column.field,
      label: column.headerName || column.field,
    }));
  const columnFieldOrder = downloadableColumnOptions.map((option) => option.field);
  const headerLabelByField = new Map(
    downloadableColumnOptions.map((option) => [option.field, option.label])
  );

  const getBulkInputProps = () => {
    if (!bulkEditField) {
      return { type: "text" };
    }
    if (integerFields.has(bulkEditField)) {
      return { type: "number", inputProps: { step: 1 } };
    }
    if (decimalFields.has(bulkEditField)) {
      return { type: "number", inputProps: { step: "any" } };
    }
    if (bulkEditField === "offer_date") {
      return { type: "date" };
    }
    return { type: "text" };
  };

  const transformBulkValue = (field, inputValue) => {
    const normalized = (inputValue ?? "").trim();
    if (normalized === "") {
      return null;
    }
    if (decimalFields.has(field)) {
      const parsed = parseFloat(normalized);
      if (Number.isNaN(parsed)) {
        throw new Error("Please enter a numeric value.");
      }
      return parsed;
    }
    if (integerFields.has(field)) {
      const parsed = parseInt(normalized, 10);
      if (Number.isNaN(parsed)) {
        throw new Error("Please enter a whole number.");
      }
      return parsed;
    }
    return normalized;
  };

  const handleBulkEditOpen = () => {
    if (!selectedIds.length) {
      alert("Select at least one product to edit.");
      return;
    }
    setBulkEditField("");
    setBulkEditValue("");
    setBulkEditOpen(true);
  };

  const handleBulkEditClose = () => {
    if (bulkActionLoading) {
      return;
    }
    setBulkEditOpen(false);
    setBulkEditField("");
    setBulkEditValue("");
  };

  const handleBulkEditSubmit = async () => {
    if (!bulkEditField) {
      alert("Select a field to update.");
      return;
    }
    let valueToApply;
    try {
      valueToApply = transformBulkValue(bulkEditField, bulkEditValue);
    } catch (error) {
      alert(error.message);
      return;
    }
    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          updateProduct(Number(id), { [bulkEditField]: valueToApply })
        )
      );
      alert(`Updated ${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"}.`);
      setBulkEditOpen(false);
      setBulkEditField("");
      setBulkEditValue("");
      await loadProducts();
    } catch (error) {
      console.error("Bulk edit error:", error);
      alert(`Failed to update selected products: ${error.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkMarkOutOfStock = async () => {
    if (!selectedIds.length) {
      alert("Select at least one product to update.");
      return;
    }
    if (
      !window.confirm(
        `Mark ${selectedIds.length} selected product${selectedIds.length === 1 ? "" : "s"} out of stock?`
      )
    ) {
      return;
    }
    setBulkActionLoading(true);
    try {
      // Save undo state before making changes
      const affectedProducts = products.filter((p) => selectedIds.includes(String(p.id)));
      const undoAction = {
        type: 'mark_out_of_stock',
        products: affectedProducts.map((p) => ({
          id: p.id,
          out_of_stock: p.out_of_stock,
        })),
        timestamp: new Date().toISOString(),
      };

      await Promise.all(selectedIds.map((id) => markOutOfStock(Number(id))));

      // Add to undo stack (keep last 10 operations)
      setUndoStack((prev) => [...prev.slice(-9), undoAction]);

      alert(`Marked ${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"} out of stock.`);
      await loadProducts();
    } catch (error) {
      console.error("Bulk mark out of stock error:", error);
      alert(`Failed to mark selected products out of stock: ${error.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkMarkInStock = async () => {
    if (!selectedIds.length) {
      alert("Select at least one product to update.");
      return;
    }
    if (
      !window.confirm(
        `Mark ${selectedIds.length} selected product${selectedIds.length === 1 ? "" : "s"} back in stock?`
      )
    ) {
      return;
    }
    setBulkActionLoading(true);
    try {
      // Save undo state before making changes
      const affectedProducts = products.filter((p) => selectedIds.includes(String(p.id)));
      const undoAction = {
        type: 'mark_in_stock',
        products: affectedProducts.map((p) => ({
          id: p.id,
          out_of_stock: p.out_of_stock,
        })),
        timestamp: new Date().toISOString(),
      };

      // Mark in stock by updating out_of_stock to false
      await Promise.all(
        selectedIds.map((id) =>
          updateProduct(Number(id), { out_of_stock: false })
        )
      );

      // Add to undo stack (keep last 10 operations)
      setUndoStack((prev) => [...prev.slice(-9), undoAction]);

      alert(`Marked ${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"} back in stock.`);
      await loadProducts();
    } catch (error) {
      console.error("Bulk mark in stock error:", error);
      alert(`Failed to mark selected products in stock: ${error.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) {
      alert("Nothing to undo.");
      return;
    }

    const lastAction = undoStack[undoStack.length - 1];
    const actionDesc = lastAction.type === 'mark_out_of_stock'
      ? 'marking products out of stock'
      : 'marking products in stock';

    if (!window.confirm(`Undo ${actionDesc} for ${lastAction.products.length} product(s)?`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      // Restore original values
      await Promise.all(
        lastAction.products.map((p) =>
          updateProduct(p.id, { out_of_stock: p.out_of_stock })
        )
      );

      // Remove from undo stack
      setUndoStack((prev) => prev.slice(0, -1));

      alert(`Undid ${actionDesc}.`);
      await loadProducts();
    } catch (error) {
      console.error("Undo error:", error);
      alert(`Failed to undo: ${error.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDownloadSelectedOpen = () => {
    if (!selectedIds.length) {
      alert("Select at least one product to download.");
      return;
    }
    const sanitized = sanitizeDownloadSelection(
      downloadSelectedColumns.length ? downloadSelectedColumns : DEFAULT_DOWNLOAD_COLUMNS,
      columnFieldOrder
    );
    setDownloadSelectedColumns(
      sanitized.length
        ? sanitized
        : sanitizeDownloadSelection(DEFAULT_DOWNLOAD_COLUMNS, columnFieldOrder)
    );
    setDownloadDialogOpen(true);
  };

  const handleDownloadSelectedClose = () => {
    setDownloadDialogOpen(false);
  };

  const handleDownloadColumnToggle = (field) => {
    setDownloadSelectedColumns((prev) => {
      const hasField = prev.includes(field);
      const updated = hasField ? prev.filter((item) => item !== field) : [...prev, field];
      return sanitizeDownloadSelection(updated, columnFieldOrder);
    });
  };

  const formatDateForTimezone = (value) => {
    if (!value) {
      return "";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString("en-US", { timeZone: timezone });
  };

  const getDownloadValue = (product, field) => {
    switch (field) {
      case "customer_cost": {
        const price = Number(product.price);
        const moq = Number(product.moq);
        return !Number.isNaN(price) && !Number.isNaN(moq) ? price * moq : "";
      }
      case "profit_per_moq": {
        const price = Number(product.price);
        const cost = Number(product.cost);
        const moq = Number(product.moq);
        return !Number.isNaN(price) && !Number.isNaN(cost) && !Number.isNaN(moq)
          ? (price - cost) * moq
          : "";
      }
      case "roi": {
        const net = Number(product.net);
        const price = Number(product.price);
        return !Number.isNaN(net) && !Number.isNaN(price) && price !== 0 ? (net / price) * 100 : "";
      }
      case "offer_date":
        return formatDateForTimezone(product.offer_date);
      case "last_sent":
        return formatDateForTimezone(product.last_sent);
      case "exp_date":
        return product.exp_date ? "'" + product.exp_date : "";
      case "out_of_stock":
        return product.out_of_stock ? "true" : "false";
      default: {
        const value = product[field];
        return value ?? "";
      }
    }
  };

  const handleDownloadSelectedSubmit = () => {
    const columnsToExport = sanitizeDownloadSelection(downloadSelectedColumns, columnFieldOrder);
    if (!columnsToExport.length) {
      alert("Select at least one column to download.");
      return;
    }
    const selectedProducts = filteredProducts.filter((p) =>
      selectedIds.includes(String(p.id))
    );
    if (!selectedProducts.length) {
      alert("No products selected to download.");
      return;
    }
    const headerRow = columnsToExport.map(
      (field) => headerLabelByField.get(field) || field
    );
    const dataRows = selectedProducts.map((product) =>
      columnsToExport.map((field) => escapeCsvValue(getDownloadValue(product, field)))
    );
    const csvContent = [headerRow, ...dataRows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `selected_products_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadDialogOpen(false);
  };

  const bulkInputProps = getBulkInputProps();
  const allCategories = [
    "Appliances",
    "Automotive",
    "Baby",
    "Beauty & Personal Care",
    "Cell Phones & Accessories",
    "Clothing, Shoes & Jewelry",
    "Electronics",
    "Health & Household",
    "Home & Kitchen",
    "Industrial & Scientific",
    "Kitchen & Dining",
    "Musical Instruments",
    "Patio, Lawn & Garden",
    "Pet Supplies",
    "Sports & Outdoors",
    "Tools & Home Improvement",
    "Toys & Games",
    "Office Products",
    "Grocery & Gourmet Food",
    "Video Games",
    "Arts, Crafts & Sewing",
    "Camera & Photo",
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiration");
    localStorage.removeItem("sortModel");
    navigate("/login");
  };

  // If vendor performance view is active, show that instead
  if (showVendorPerformance) {
    return <VendorPerformance onBack={() => setShowVendorPerformance(false)} />;
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: isMobile ? 150 : 200,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: isMobile ? 150 : 200,
            boxSizing: "border-box",
            p: 2,
            bgcolor: settings.theme === "dark" ? "#1e1e1e" : "white",
            borderRight: `1px solid ${settings.theme === "dark" ? "#333" : "#e0e0e0"}`,
          },
        }}
      >
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ alignSelf: "flex-end", mb: 1 }}>
            ✕
          </IconButton>
        )}

        {/* Navigation Buttons */}
        <Stack spacing={1} sx={{ mb: 3 }}>
          {onBack && (
            <Button variant="contained" onClick={onBack} fullWidth>
              Back to Public View
            </Button>
          )}
          <Button variant="contained" color="secondary" onClick={handleLogout} fullWidth>
            Logout
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Deal Cost Filter */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: settings.theme === "dark" ? "#90caf9" : "#003087" }}>
          Deal Cost (per MOQ)
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {dealCostPresets.map(({ label, range }) => {
            const isActive =
              dealCostRange[0] === range[0] &&
              (range[1] === Infinity ? dealCostRange[1] === Infinity : dealCostRange[1] === range[1]);
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

        {/* Category Filter */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: settings.theme === "dark" ? "#90caf9" : "#003087" }}>
          Category
        </Typography>
        <FormControl size="small" fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Select Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">(All)</MenuItem>
            {allCategories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* Vendor Filter */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: settings.theme === "dark" ? "#90caf9" : "#003087" }}>
          Vendor
        </Typography>
        <TextField
          fullWidth
          size="small"
          label="Vendor Name"
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
          placeholder="e.g., Vendor A"
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }} />

        {/* Stock Status Filter */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: settings.theme === "dark" ? "#90caf9" : "#003087" }}>
          Stock Status
        </Typography>
        <FormControl size="small" fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Status</InputLabel>
          <Select
            value={stockFilter}
            label="Select Status"
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="in">In Stock</MenuItem>
            <MenuItem value="out">Out of Stock</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* Expiration Filter */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: settings.theme === "dark" ? "#90caf9" : "#003087" }}>
          Expiration Status
        </Typography>
        <FormControl size="small" fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Status</InputLabel>
          <Select
            value={expirationFilter}
            label="Select Status"
            onChange={(e) => setExpirationFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="expiring">Expiring Soon (6 months)</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
          </Select>
        </FormControl>

        {/* Filter Action Buttons */}
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Button variant="contained" onClick={applyFilters} fullWidth>
            Apply Filters
          </Button>
          <Button variant="outlined" onClick={resetFilters} fullWidth>
            Reset Filters
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Action Buttons */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: settings.theme === "dark" ? "#90caf9" : "#003087" }}>
          Actions
        </Typography>
        <Stack spacing={1}>
          <Button variant="contained" onClick={handleAddClick} fullWidth>
            Add Product
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setShowVendorPerformance(true)}
            fullWidth
          >
            View Vendor Performance
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={() => setCustomizeDialogOpen(true)}
            fullWidth
          >
            Customize Columns
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleUploadClick}
            disabled={uploading}
            fullWidth
          >
            {uploading ? "Uploading..." : "Upload CSV"}
          </Button>
          <Button variant="contained" color="primary" onClick={handleDownloadInventory} fullWidth>
            Download Inventory
          </Button>
          <Button variant="contained" color="success" onClick={handleSendWhatsApp} fullWidth>
            Send WhatsApp
          </Button>
          <Button variant="contained" color="success" onClick={handleSendGroupEmail} fullWidth>
            Send Group Email
          </Button>
          <Button variant="contained" color="primary" onClick={() => setSettingsDialogOpen(true)} fullWidth>
            Display & Settings
          </Button>
        </Stack>

        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 1 }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && (
          <>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              {isMobile && (
                <IconButton onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h4" sx={{ flexGrow: 1 }}>
                Internal Product List
              </Typography>
            </Box>
            <TextField
              label="Search All Fields"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <div style={{ height: isMobile ? "calc(100vh - 150px)" : 600, width: "100%" }}>
              <DataGrid
                rows={filteredProducts}
                columns={columns}
                getRowId={(row) => String(row.id)}
                checkboxSelection
                selectionModel={selectedIds}
                onSelectionModelChange={handleSelectionModelChange}
                pagination
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                columnVisibilityModel={columnVisibilityModel}
                sortModel={sortModel}
                onSortModelChange={handleSortModelChange}
              />
            </div>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
              sx={{ mt: 2 }}
            >
              <Typography variant="caption" color="text.secondary">
                {selectedIds.length
                  ? `${selectedIds.length} item${selectedIds.length === 1 ? "" : "s"} selected`
                  : "No items selected"}
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  variant="contained"
                  color="info"
                  onClick={handleBulkEditOpen}
                  disabled={!selectedIds.length || bulkActionLoading}
                >
                  Bulk Edit Selected
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleBulkMarkOutOfStock}
                  disabled={!selectedIds.length || bulkActionLoading}
                >
                  Mark Out of Stock
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleBulkMarkInStock}
                  disabled={!selectedIds.length || bulkActionLoading}
                >
                  Mark In Stock
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleDownloadSelectedOpen}
                  disabled={!selectedIds.length || bulkActionLoading}
                >
                  Download Selected
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0 || bulkActionLoading}
                >
                  Undo ({undoStack.length})
                </Button>
              </Stack>
            </Stack>
          </>
        )}
      </Box>
      <ProductFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialData={selectedProduct}
        onClose={handleDialogClose}
        onSubmit={handleFormSubmit}
        timezone={timezone}
      />
      <CustomizeColumnsDialog
        open={customizeDialogOpen}
        onClose={() => setCustomizeDialogOpen(false)}
        columns={baseColumns}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      />
      <Dialog
        open={bulkEditOpen}
        onClose={handleBulkEditClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Bulk Edit Products</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Applying changes to {selectedIds.length} selected product{selectedIds.length === 1 ? "" : "s"}.
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Field</InputLabel>
              <Select
                value={bulkEditField}
                label="Field"
                onChange={(e) => setBulkEditField(e.target.value)}
              >
                {bulkEditableFields.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={bulkEditField === "offer_date" ? "New Date" : "New Value"}
              fullWidth
              value={bulkEditValue}
              onChange={(e) => setBulkEditValue(e.target.value)}
              type={bulkInputProps.type}
              inputProps={bulkInputProps.inputProps}
              disabled={bulkActionLoading}
              helperText="Leave blank to clear the value for all selected products."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkEditClose} disabled={bulkActionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkEditSubmit}
            disabled={!bulkEditField || bulkActionLoading}
          >
            {bulkActionLoading ? "Applying..." : "Apply"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={downloadDialogOpen}
        onClose={handleDownloadSelectedClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Download Selected Products</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Choose which columns to include for the {selectedIds.length} selected product{selectedIds.length === 1 ? "" : "s"}.
            </Typography>
            <FormGroup>
              <Grid container spacing={1}>
                {downloadableColumnOptions.map((option) => (
                  <Grid item xs={12} sm={6} md={4} key={option.field}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={downloadSelectedColumns.includes(option.field)}
                          onChange={() => handleDownloadColumnToggle(option.field)}
                        />
                      }
                      label={option.label}
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDownloadSelectedClose}>Cancel</Button>
          <Button
            onClick={handleDownloadSelectedSubmit}
            disabled={!sanitizeDownloadSelection(downloadSelectedColumns, columnFieldOrder).length}
          >
            Download CSV
          </Button>
        </DialogActions>
      </Dialog>
      <SettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        settings={settings}
        updateSettings={updateSettings}
      />
    </Box>
  );
};

export default InternalProductList;

