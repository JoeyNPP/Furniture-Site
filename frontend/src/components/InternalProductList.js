import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  TextField,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Popover,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ProductFormDialog from "./ProductFormDialog";
import CustomizeColumnsDialog from "./CustomizeColumnsDialog";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  markOutOfStock,
  searchProducts,
  uploadProducts,
} from "../api";
import { sendIndividualEmails, sendGroupEmail } from "../emailSender";
import * as XLSX from "xlsx";
import { jwtDecode } from 'jwt-decode';

const InternalProductList = ({ onBack }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("in");
  const [pageSize, setPageSize] = useState(50);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [sortModel, setSortModel] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customizeDialogOpen, setCustomizeDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditField, setBulkEditField] = useState("");
  const [bulkEditValue, setBulkEditValue] = useState("");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const timezone = "America/New_York";

  const bulkEditableFields = [
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
    { value: "amazon_url", label: "Amazon URL" },
    { value: "walmart_url", label: "Walmart URL" },
    { value: "ebay_url", label: "eBay URL" },
    { value: "image_url", label: "Image URL" },
  ];

  const integerFields = new Set(["moq", "qty", "sales_per_month"]);
  const decimalFields = new Set(["price", "cost", "net"]);

  const menuOpen = Boolean(menuAnchorEl);

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
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
    setColumnVisibilityModel(defaultModel);
    localStorage.setItem("columnVisibilityModel", JSON.stringify(defaultModel));
  }, []);

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
        Object.values(product).some((value) =>
          value !== null && value !== undefined && value.toString().toLowerCase().includes(lowerQuery)
        )
      );
      setFilteredProducts(searchedProducts);
    }
  }, [searchQuery, products]);

  const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);
    localStorage.setItem("columnVisibilityModel", JSON.stringify(newModel));
  };

  const handleSortModelChange = (newSortModel) => {
    setSortModel(newSortModel);
    localStorage.setItem("sortModel", JSON.stringify(newSortModel));
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
    setFilteredProducts(temp);
  };

  const resetFilters = () => {
    setCategoryFilter("");
    setVendorFilter("");
    setStockFilter("in");
    setFilteredProducts(products.filter((p) => p.out_of_stock === false));
  };

  const handleSelectionModelChange = (newSelection) => {
    setSelectedIds(newSelection.map(String));
  };

  const handleSendIndividualEmails = async () => {
    const selectedProducts = filteredProducts.filter((p) =>
      selectedIds.includes(String(p.id))
    );
    if (!selectedProducts.length) {
      alert("No products selected for individual email.");
      return;
    }
    await sendIndividualEmails(selectedProducts);
    loadProducts();
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

  const getBulkInputProps = () => {
    if (!bulkEditField) {
      return { type: 'text' };
    }
    if (integerFields.has(bulkEditField)) {
      return { type: 'number', inputProps: { step: 1 } };
    }
    if (decimalFields.has(bulkEditField)) {
      return { type: 'number', inputProps: { step: 'any' } };
    }
    if (bulkEditField === 'offer_date') {
      return { type: 'date' };
    }
    return { type: 'text' };
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
      loadProducts();
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
      await Promise.all(selectedIds.map((id) => markOutOfStock(Number(id))));
      alert(`Marked ${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"} out of stock.`);
      loadProducts();
    } catch (error) {
      console.error("Bulk mark out of stock error:", error);
      alert(`Failed to mark selected products out of stock: ${error.message}`);
    } finally {
      setBulkActionLoading(false);
    }
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
      "eBay URL",
      "Sales Per Month",
      "Net",
      "ROI (%)"
    ]);
    Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a)).forEach((date) => {
      data.push([date]);
      groupedByDate[date].forEach((product) => {
        const net = Number(product.net);
        const price = Number(product.price);
        let roi = "";
        if (!isNaN(net) && !isNaN(price) && price !== 0) {
          roi = ((net / price) * 100).toFixed(2);
        }
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
          product.sales_per_month || "",
          product.net || "",
          roi
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
    { field: "title", headerName: "Title", width: 200 },
    { field: "category", headerName: "Category", width: 200 },
    { field: "vendor_id", headerName: "Vendor ID", width: 120 },
    { field: "vendor", headerName: "Vendor", width: 150 },
    { field: "price", headerName: "Price", width: 100, type: "number" },
    { field: "cost", headerName: "Cost", width: 100, type: "number" },
    { field: "moq", headerName: "MOQ", width: 100, type: "number" },
    { field: "qty", headerName: "Qty", width: 100, type: "number" },
    { field: "upc", headerName: "UPC", width: 120 },
    { field: "asin", headerName: "ASIN", width: 120 },
    { field: "lead_time", headerName: "Lead Time", width: 120 },
    { field: "exp_date", headerName: "Exp Date", width: 120 },
    { field: "fob", headerName: "FOB", width: 100 },
    { field: "image_url", headerName: "Image URL", width: 200 },
    { field: "out_of_stock", headerName: "Out of Stock", width: 110, type: "boolean" },
    { field: "amazon_url", headerName: "Amazon URL", width: 200 },
    { field: "walmart_url", headerName: "Walmart URL", width: 200 },
    { field: "ebay_url", headerName: "eBay URL", width: 200 },
    {
      field: "offer_date",
      headerName: "Offer Date",
      width: 180,
      valueFormatter: (params) =>
        params.value
          ? new Date(params.value).toLocaleString('en-US', { timeZone: timezone })
          : "",
    },
    {
      field: "last_sent",
      headerName: "Last Sent",
      width: 180,
      valueFormatter: (params) =>
        params.value
          ? new Date(params.value).toLocaleString('en-US', { timeZone: timezone })
          : "",
    },
    {
      field: "customer_cost",
      headerName: "Customer Cost per MOQ",
      width: 180,
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
      width: 180,
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
      width: 150,
      type: "number",
    },
    {
      field: "net",
      headerName: "Net",
      width: 150,
      type: "number",
    },
    {
      field: "roi",
      headerName: "ROI (%)",
      width: 150,
      type: "number",
      valueGetter: (params) => {
        const net = Number(params.row.net);
        const price = Number(params.row.price);
        if (!isNaN(net) && !isNaN(price) && price !== 0) {
          return (net / price) * 100;
        }
        return "";
      },
      valueFormatter: (params) =>
        params.value ? `${params.value.toFixed(2)}%` : "",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 250,
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

  const columns = [
    ...baseColumns.filter((col) => col.field === "actions"),
    ...baseColumns.filter((col) => col.field !== "actions"),
  ].map((col) => {
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
    return col;
  });

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
    "Industrial & Industrial",
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

  const bulkInputProps = getBulkInputProps();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiration");
    localStorage.removeItem("sortModel");
    navigate("/login");
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={<MenuIcon />}
          onClick={handleMenuOpen}
          sx={{ whiteSpace: "nowrap" }}
        >
          Filters & Actions
        </Button>
        <Typography
          variant="h4"
          sx={{
            flexGrow: 1,
            textAlign: { xs: "left", sm: "right" },
          }}
        >
          Internal Product List
        </Typography>
      </Stack>

      <Popover
        open={menuOpen}
        anchorEl={menuAnchorEl}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box sx={{ p: 2, width: 320, maxWidth: "100%" }}>
          {onBack && (
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                handleMenuClose();
                onBack();
              }}
              sx={{ mb: 1 }}
            >
              Back to Public View
            </Button>
          )}
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            onClick={() => {
              handleMenuClose();
              handleLogout();
            }}
            sx={{ mb: 2 }}
          >
            Logout
          </Button>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Filters
          </Typography>
          <Stack spacing={1} sx={{ mb: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
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
            <TextField
              fullWidth
              margin="dense"
              label="Vendor"
              name="vendor"
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              placeholder="Enter Vendor Name (e.g., Vendor A)"
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Stock Status</InputLabel>
              <Select
                value={stockFilter}
                label="Stock Status"
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="in">In Stock</MenuItem>
                <MenuItem value="out">Out of Stock</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  handleMenuClose();
                  applyFilters();
                }}
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  handleMenuClose();
                  resetFilters();
                }}
              >
                Reset
              </Button>
            </Stack>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Actions
          </Typography>
          <Stack spacing={1}>
            <Button
              variant="contained"
              onClick={() => {
                handleMenuClose();
                handleAddClick();
              }}
            >
              Add Product
            </Button>
            <Button
              variant="contained"
              color="info"
              onClick={() => {
                handleMenuClose();
                setCustomizeDialogOpen(true);
              }}
            >
              Customize Columns
            </Button>
            <Button
              variant="contained"
              color="secondary"
              disabled={uploading}
              onClick={() => {
                handleMenuClose();
                handleUploadClick();
              }}
            >
              {uploading ? "Uploading..." : "Upload CSV"}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                handleMenuClose();
                handleDownloadInventory();
              }}
            >
              Download Inventory
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                handleMenuClose();
                handleSendIndividualEmails();
              }}
            >
              Send Individual Emails
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                handleMenuClose();
                handleSendGroupEmail();
              }}
            >
              Send Group Email
            </Button>
          </Stack>
        </Box>
      </Popover>

      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TextField
            label="Search All Fields"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <div
            style={{
              height: isMobile ? "calc(100vh - 150px)" : 600,
              width: "100%",
            }}
          >
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
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ mt: 2 }}
            alignItems={{ xs: "stretch", sm: "center" }}
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
              Mark Selected Out of Stock
            </Button>
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            {selectedIds.length
              ? `${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'} selected`
              : 'No items selected'}
          </Typography>
        </>
      )}
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
              Applying changes to {selectedIds.length} selected product{selectedIds.length === 1 ? '' : 's'}.
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
              label={bulkEditField === 'offer_date' ? 'New Date' : 'New Value'}
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
            {bulkActionLoading ? 'Applying...' : 'Apply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InternalProductList;
