import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  Divider,
  Grid,
  Autocomplete,
  Chip,
} from "@mui/material";
import { checkDuplicate } from "../api";

const ProductFormDialog = ({ open, mode, initialData, onClose, onSubmit, timezone }) => {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    vendor_id: "",
    vendor: "",
    price: "",
    moq: "",
    qty: "",
    upc: "",
    sku: "",
    lead_time: "",
    exp_date: "",
    fob: "",
    image_url: "",
    out_of_stock: false,
    offer_date: "",
    last_sent: "",
    // Furniture-specific fields
    brand: "",
    color: "",
    material: "",
    room_type: "",
    style: "",
    condition: "New",
    width: "",
    depth: "",
    height: "",
    weight: "",
    warranty: "",
    assembly_required: false,
  });
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        category: initialData.category || "",
        vendor_id: initialData.vendor_id || "",
        vendor: initialData.vendor || "",
        price: initialData.price || "",
        moq: initialData.moq || "",
        qty: initialData.qty || "",
        upc: initialData.upc || "",
        sku: initialData.sku || "",
        lead_time: initialData.lead_time || "",
        exp_date: initialData.exp_date || "",
        fob: initialData.fob || "",
        image_url: initialData.image_url || "",
        out_of_stock: initialData.out_of_stock || false,
        offer_date: initialData.offer_date ? new Date(initialData.offer_date).toISOString().split('T')[0] : "",
        last_sent: initialData.last_sent ? new Date(initialData.last_sent).toISOString().split('T')[0] : "",
        // Furniture-specific fields
        brand: initialData.brand || "",
        color: initialData.color || "",
        material: initialData.material || "",
        room_type: initialData.room_type || "",
        style: initialData.style || "",
        condition: initialData.condition || "New",
        width: initialData.width || "",
        depth: initialData.depth || "",
        height: initialData.height || "",
        weight: initialData.weight || "",
        warranty: initialData.warranty || "",
        assembly_required: initialData.assembly_required || false,
      });
    } else {
      // For new products, default offer_date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        title: "",
        category: "",
        vendor_id: "",
        vendor: "",
        price: "",
        moq: "",
        qty: "",
        upc: "",
        sku: "",
        lead_time: "",
        exp_date: "",
        fob: "",
        image_url: "",
        out_of_stock: false,
        offer_date: today,
        last_sent: "",
        // Furniture-specific fields
        brand: "",
        color: "",
        material: "",
        room_type: "",
        style: "",
        condition: "New",
        width: "",
        depth: "",
        height: "",
        weight: "",
        warranty: "",
        assembly_required: false,
      });
    }
  }, [initialData, open]);

  useEffect(() => {
    if (!open) {
      localStorage.removeItem("productFormData"); // Clear saved form data when dialog closes
    }
  }, [open]);

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;
    // Handle numeric fields
    if (["price", "width", "depth", "height", "weight"].includes(name)) {
      newValue = value === "" ? "" : parseFloat(value);
    }
    // Handle integer fields
    if (["moq", "qty"].includes(name)) {
      newValue = value === "" ? "" : parseInt(value, 10);
    }
    const newFormData = {
      ...formData,
      [name]: newValue,
    };
    setFormData(newFormData);
    console.log(`Form field updated: ${name} = ${newValue}`);

    // Check for duplicates when SKU or UPC is changed (only for new products)
    if (mode === "add" && (name === "sku" || name === "upc") && value.trim()) {
      try {
        const skuToCheck = name === "sku" ? value : newFormData.sku;
        const upcToCheck = name === "upc" ? value : newFormData.upc;
        const result = await checkDuplicate(skuToCheck, upcToCheck);
        if (result.duplicate && result.products.length > 0) {
          setDuplicateWarning({
            field: name.toUpperCase(),
            value: value,
            products: result.products
          });
        } else {
          setDuplicateWarning(null);
        }
      } catch (error) {
        console.error("Error checking for duplicates:", error);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    // Convert empty strings to null for numeric fields before submitting
   const submitData = {
     ...formData,
     price: formData.price === "" ? null : formData.price,
     moq: formData.moq === "" ? null : formData.moq,
     qty: formData.qty === "" ? null : formData.qty,
     width: formData.width === "" ? null : formData.width,
     depth: formData.depth === "" ? null : formData.depth,
     height: formData.height === "" ? null : formData.height,
     weight: formData.weight === "" ? null : formData.weight,
     // strip empty date strings so backend will default them
     offer_date: formData.offer_date === "" ? undefined : formData.offer_date,
     last_sent:  formData.last_sent  === "" ? undefined : formData.last_sent,
   };
    onSubmit(submitData);
  };

  // Furniture categories
  const allCategories = [
    "Desks",
    "Chairs",
    "Tables",
    "Storage & Filing",
    "Cubicles & Partitions",
    "Sofas & Lounge",
    "Reception Furniture",
    "Conference Room",
    "Bookcases & Shelving",
    "Accessories",
    "Lighting",
    "Outdoor Furniture",
  ];

  const roomTypes = [
    "Office",
    "Conference Room",
    "Reception",
    "Lounge & Reception",
    "Break Room",
    "Home Office",
    "Executive Suite",
    "Open Plan",
    "Training Room",
    "Waiting Area",
  ];

  const styles = [
    "Modern",
    "Traditional",
    "Contemporary",
    "Industrial",
    "Mid-Century",
    "Minimalist",
    "Ergonomic",
    "Executive",
  ];

  const materials = [
    "Wood",
    "Metal",
    "Glass",
    "Leather",
    "Fabric",
    "Laminate",
    "Veneer",
    "Plastic",
    "Steel",
    "Aluminum",
    "MDF",
    "Particleboard",
    "Mesh",
  ];

  const colors = [
    "Black",
    "White",
    "Gray",
    "Brown",
    "Walnut",
    "Oak",
    "Cherry",
    "Mahogany",
    "Espresso",
    "Natural",
    "Beige",
    "Navy",
    "Blue",
    "Green",
    "Red",
  ];

  // Helper to convert comma-separated string to array
  const parseMultiValue = (value) => {
    if (!value) return [];
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  };

  // Helper to convert array to comma-separated string
  const joinMultiValue = (arr) => {
    return arr.join(", ");
  };

  const conditions = [
    "New",
    "Refurbished",
    "Used - Like New",
    "Used - Good",
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{mode === "add" ? "Add Product" : "Edit Product"}</DialogTitle>
      <DialogContent>
        {duplicateWarning && (
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }} onClose={() => setDuplicateWarning(null)}>
            <Box>
              <strong>Possible Duplicate Detected!</strong>
              <Box sx={{ mt: 1 }}>
                {duplicateWarning.field} "{duplicateWarning.value}" already exists in:
              </Box>
              {duplicateWarning.products.map((product) => (
                <Box key={product.id} sx={{ mt: 1, ml: 2, fontSize: '0.9em' }}>
                  • {product.title} {product.vendor ? `(${product.vendor})` : ''}
                  {product.sku && ` - SKU: ${product.sku}`}
                  {product.upc && ` - UPC: ${product.upc}`}
                </Box>
              ))}
              <Box sx={{ mt: 1, fontStyle: 'italic' }}>
                Consider updating the existing product instead of creating a duplicate.
              </Box>
            </Box>
          </Alert>
        )}
        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          {/* Basic Information */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: "#003087" }}>
            Basic Information
          </Typography>
          <TextField
            fullWidth
            margin="dense"
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                >
                  <MenuItem value="">Select Category</MenuItem>
                  {allCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Vendor ID"
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleChange}
                placeholder="Enter Vendor ID"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Vendor"
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Pricing & Inventory */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: "#003087" }}>
            Pricing & Inventory
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                margin="dense"
                label="Price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                type="number"
                InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                onWheel={(e) => e.target.blur()}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                margin="dense"
                label="MOQ"
                name="moq"
                value={formData.moq}
                onChange={handleChange}
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                onWheel={(e) => e.target.blur()}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                margin="dense"
                label="Qty"
                name="qty"
                value={formData.qty}
                onChange={handleChange}
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                onWheel={(e) => e.target.blur()}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                margin="dense"
                label="UPC"
                name="upc"
                value={formData.upc}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                margin="dense"
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                margin="dense"
                label="FOB"
                name="fob"
                value={formData.fob}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Lead Time"
                name="lead_time"
                value={formData.lead_time}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Exp Date"
                name="exp_date"
                value={formData.exp_date}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Furniture Details */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: "#003087" }}>
            Furniture Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Autocomplete
                multiple
                freeSolo
                options={roomTypes}
                value={parseMultiValue(formData.room_type)}
                onChange={(e, newValue) => setFormData({ ...formData, room_type: joinMultiValue(newValue) })}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Room Type(s)" margin="dense" placeholder="Select or type..." helperText="Select multiple or type custom values" />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Autocomplete
                multiple
                freeSolo
                options={styles}
                value={parseMultiValue(formData.style)}
                onChange={(e, newValue) => setFormData({ ...formData, style: joinMultiValue(newValue) })}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Style(s)" margin="dense" placeholder="Select or type..." helperText="Select multiple or type custom values" />
                )}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Autocomplete
                multiple
                freeSolo
                options={colors}
                value={parseMultiValue(formData.color)}
                onChange={(e, newValue) => setFormData({ ...formData, color: joinMultiValue(newValue) })}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Color(s)" margin="dense" placeholder="Select or type..." />
                )}
              />
            </Grid>
            <Grid item xs={4}>
              <Autocomplete
                multiple
                freeSolo
                options={materials}
                value={parseMultiValue(formData.material)}
                onChange={(e, newValue) => setFormData({ ...formData, material: joinMultiValue(newValue) })}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Material(s)" margin="dense" placeholder="Select or type..." />
                )}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Condition</InputLabel>
                <Select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  label="Condition"
                >
                  {conditions.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Dimensions */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: "#003087" }}>
            Dimensions & Weight
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <TextField
                fullWidth
                margin="dense"
                label="Width (in)"
                name="width"
                value={formData.width}
                onChange={handleChange}
                type="number"
                InputProps={{ inputProps: { min: 0, step: "0.1" } }}
                onWheel={(e) => e.target.blur()}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                margin="dense"
                label="Depth (in)"
                name="depth"
                value={formData.depth}
                onChange={handleChange}
                type="number"
                InputProps={{ inputProps: { min: 0, step: "0.1" } }}
                onWheel={(e) => e.target.blur()}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                margin="dense"
                label="Height (in)"
                name="height"
                value={formData.height}
                onChange={handleChange}
                type="number"
                InputProps={{ inputProps: { min: 0, step: "0.1" } }}
                onWheel={(e) => e.target.blur()}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                margin="dense"
                label="Weight (lbs)"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                type="number"
                InputProps={{ inputProps: { min: 0, step: "0.1" } }}
                onWheel={(e) => e.target.blur()}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Additional Details */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: "#003087" }}>
            Additional Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Warranty"
                name="warranty"
                value={formData.warranty}
                onChange={handleChange}
                placeholder="e.g., 1 Year, Lifetime"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Assembly Required</InputLabel>
                <Select
                  name="assembly_required"
                  value={formData.assembly_required}
                  onChange={handleChange}
                  label="Assembly Required"
                >
                  <MenuItem value={false}>No</MenuItem>
                  <MenuItem value={true}>Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <TextField
            fullWidth
            margin="dense"
            label="Image URL"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
          />

          <Divider sx={{ my: 2 }} />

          {/* Dates & Status */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: "#003087" }}>
            Dates & Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                margin="dense"
                label="Offer Date"
                name="offer_date"
                type="date"
                value={formData.offer_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                margin="dense"
                label="Last Sent"
                name="last_sent"
                type="date"
                value={formData.last_sent}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Out of Stock</InputLabel>
                <Select
                  name="out_of_stock"
                  value={formData.out_of_stock}
                  onChange={handleChange}
                  label="Out of Stock"
                >
                  <MenuItem value={false}>No</MenuItem>
                  <MenuItem value={true}>Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button type="submit" onClick={handleSubmit} color="primary">
          {mode === "add" ? "Add" : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductFormDialog;
