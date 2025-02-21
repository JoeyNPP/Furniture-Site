import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import ProductFormDialog from "./ProductFormDialog";
import CustomizeColumnsDialog from "./CustomizeColumnsDialog";
import { 
  fetchProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  markOutOfStock 
} from "../api";
import { sendIndividualEmails, sendGroupEmail } from "../emailSender";

const drawerWidth = 300;

// -------------------------
// Base columns definition
// -------------------------
const baseColumns = [
  { field: "title", headerName: "Title", width: 200 },
  { field: "category", headerName: "Category", width: 200 },
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
  { field: "vendor_id", headerName: "Vendor ID", width: 120 },
  { field: "image_url", headerName: "Image URL", width: 200 },
  { field: "out_of_stock", headerName: "Out of Stock", width: 110, type: "boolean" },
  { field: "amazon_url", headerName: "Amazon URL", width: 200 },
  { field: "walmart_url", headerName: "Walmart URL", width: 200 },
  { field: "ebay_url", headerName: "eBay URL", width: 200 },
  { field: "offer_date", headerName: "Offer Date", width: 180 },
  { field: "last_sent", headerName: "Last Sent", width: 180 },
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

// FULL list of categories
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

// FULL list of vendors
const allVendors = [
  "BSD",
  "Bulk",
  "123",
  "DA",
  "Fred",
  "UPD",
  "Haut",
  "NY Cos",
  "DTG",
  "MS",
  "GPS",
  "Cos",
  "Cust",
  "BB",
  "JW",
  "JAMN",
  "FlecHub",
  "Royal",
];

const InternalProductList = ({ onBack }) => {
  // -------------- Original States --------------
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("in");
  const [pageSize, setPageSize] = useState(50);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Customize columns
  const [customizeDialogOpen, setCustomizeDialogOpen] = useState(false);

  // -------------- Column Visibility --------------
  useEffect(() => {
    const savedModel = localStorage.getItem("columnVisibilityModel");
    if (savedModel) {
      setColumnVisibilityModel(JSON.parse(savedModel));
    } else {
      const defaultModel = {};
      baseColumns.forEach((col) => {
        defaultModel[col.field] = true;
      });
      setColumnVisibilityModel(defaultModel);
    }
  }, []);

  // -------------- Fetch on Mount --------------
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await fetchProducts();
      const productData = data.products || data;
      setProducts(productData);
      setFilteredProducts(productData);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }

  const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);
    localStorage.setItem("columnVisibilityModel", JSON.stringify(newModel));
  };

  // -------------- Filter Logic --------------
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
    setStockFilter("all");
    setFilteredProducts(products);
  };

  // -------------- Selection Model --------------
  const handleSelectionModelChange = (newSelection) => {
    console.log("Selected IDs:", newSelection);
    setSelectedIds(newSelection);
  };

  // -------------- Email Buttons --------------
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

  // -------------- Add / Edit Functions --------------
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
    if (dialogMode === "add") {
      await createProduct(formData);
    } else {
      if (!selectedProduct?.id) {
        console.error("No product ID to update");
        return;
      }
      await updateProduct(selectedProduct.id, formData);
    }
    setDialogOpen(false);
    loadProducts();
  };

  // -------------- Delete and Mark Out-of-Stock Functions --------------
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

  // -------------- Override Actions Column --------------
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
    return col;
  });

  // -------------- Render --------------
  return (
    <Box sx={{ display: "flex" }}>
      {/* LEFT DRAWER - FILTERS & ACTIONS */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {onBack && (
            <Button variant="contained" onClick={onBack} sx={{ mb: 2 }}>
              Back to Public View
            </Button>
          )}
          <Typography variant="h6" gutterBottom>
            Filters & Actions
          </Typography>
          <Stack spacing={1} sx={{ mb: 2 }}>
            {/* Category Filter */}
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
            {/* Vendor Filter */}
            <FormControl size="small" fullWidth>
              <InputLabel>Vendor</InputLabel>
              <Select
                value={vendorFilter}
                label="Vendor"
                onChange={(e) => setVendorFilter(e.target.value)}
              >
                <MenuItem value="">(All)</MenuItem>
                {allVendors.map((v) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Stock Filter */}
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
            <Button variant="contained" onClick={applyFilters}>
              Apply Filters
            </Button>
            <Button variant="outlined" onClick={resetFilters}>
              Reset Filters
            </Button>
          </Stack>
          {/* ACTIONS */}
          <Stack spacing={1}>
            <Button variant="contained" onClick={handleAddClick}>
              Add Product
            </Button>
            <Button
              variant="contained"
              color="info"
              onClick={() => setCustomizeDialogOpen(true)}
            >
              Customize Columns
            </Button>
            <Button variant="contained" color="success" onClick={handleSendIndividualEmails}>
              Send Individual Emails
            </Button>
            <Button variant="contained" color="success" onClick={handleSendGroupEmail}>
              Send Group Email
            </Button>
          </Stack>
        </Box>
      </Drawer>
      {/* MAIN CONTENT AREA */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Internal Product List
        </Typography>
        <div style={{ height: 600, width: "100%" }}>
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
          />
        </div>
      </Box>
      {/* ADD/EDIT DIALOG */}
      <ProductFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialData={selectedProduct}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleFormSubmit}
      />
      <CustomizeColumnsDialog
        open={customizeDialogOpen}
        onClose={() => setCustomizeDialogOpen(false)}
        columns={baseColumns}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      />
    </Box>
  );
};

export default InternalProductList;
