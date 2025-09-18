import React, { useEffect, useState, useRef } from "react";
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
useMediaQuery,
useTheme,
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
import { jwtDecode } from "jwt-decode";
const InternalProductList = ({ onBack }) => {
fileInputRef = useRef(null);
[products, setProducts] = useState([]);
[filteredProducts, setFilteredProducts] = useState([]);
[selectedIds, setSelectedIds] = useState([]);
[searchQuery, setSearchQuery] = useState("");
[categoryFilter, setCategoryFilter] = useState("");
[vendorFilter, setVendorFilter] = useState("");
[stockFilter, setStockFilter] = useState("in");
[pageSize, setPageSize] = useState(50);
[columnVisibilityModel, setColumnVisibilityModel] = useState({});
[sortModel, setSortModel] = useState([]);
[dialogOpen, setDialogOpen] = useState(false);
[dialogMode, setDialogMode] = useState("add");
[selectedProduct, setSelectedProduct] = useState(null);
[customizeDialogOpen, setCustomizeDialogOpen] = useState(false);
[drawerOpen, setDrawerOpen] = useState(false);
[uploading, setUploading] = useState(false);
[loading, setLoading] = useState(false);
navigate = useNavigate();
theme = useTheme();
isMobile = useMediaQuery(theme.breakpoints.down("sm"));
drawerWidth = isMobile ? 150 : 200;
timezone = "America/New_York";
handleUploadClick = () => {
if (fileInputRef.current) {
fileInputRef.current.value = "";
fileInputRef.current.click();
}
};
handleFileChange = async (event) => {
const file = event.target.files && event.target.files[0];
if (!file) {
return;
}
setUploading(true);
try {
const result = await uploadProducts(file);
alert(
`Import complete: ${result.inserted} inserted, ${result.updated} updated,
${result.skipped} skipped`
);
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
const productData = Array.isArray(response.products)
? response.products
: Array.isArray(response)
? response
: [];
if (!Array.isArray(productData)) {
console.error("Product data is not an array:", productData);
setProducts([]);
setFilteredProducts([]);
return;
}
setProducts(productData);
setFilteredProducts(
productData.filter((p) => p.out_of_stock === false)
);
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
handleColumnVisibilityChange = (newModel) => {
setColumnVisibilityModel(newModel);
localStorage.setItem("columnVisibilityModel", JSON.stringify(newModel));
};
handleSortModelChange = (newSortModel) => {
setSortModel(newSortModel);
localStorage.setItem("sortModel", JSON.stringify(newSortModel));
};
applyFilters = () => {
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
temp = temp.filter((p) => !p.out_of_stock);
} else if (stockFilter === "out") {
temp = temp.filter((p) => p.out_of_stock);
}
setFilteredProducts(temp);
};
resetFilters = () => {
setCategoryFilter("");
setVendorFilter("");
setStockFilter("in");
setFilteredProducts(products.filter((p) => !p.out_of_stock));
};
handleSelectionModelChange = (ids) => {
setSelectedIds(ids);
};
async function handleSendIndividualEmails() {
if (!selectedIds.length) {
alert("Select at least one.");
return;
}
await sendIndividualEmails(
filteredProducts.filter((p) => selectedIds.includes(String(p.id)))
);
loadProducts();
}
async function handleSendGroupEmail() {
if (!selectedIds.length) {
alert("Select at least one.");
return;
}
await sendGroupEmail(
filteredProducts.filter((p) => selectedIds.includes(String(p.id)))
);
loadProducts();
}
handleAddClick = () => {
setDialogMode("add");
setSelectedProduct(null);
setDialogOpen(true);
};
handleEditClick = (p) => {
setDialogMode("edit");
setSelectedProduct(p);
setDialogOpen(true);
};
handleDialogClose = () => setDialogOpen(false);
async function handleFormSubmit(data) {
try {
if (dialogMode === "add") {
await createProduct(data);
} else if (selectedProduct) {
await updateProduct(selectedProduct.id, data);
}
loadProducts();
} catch (error) {
console.error("Failed to save product:", error);
alert(`Failed to save product: ${error.message}`);
} finally {
setDialogOpen(false);
}
}
async function handleDelete(id) {
if