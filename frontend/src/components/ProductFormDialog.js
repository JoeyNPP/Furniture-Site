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
} from "@mui/material";

const ProductFormDialog = ({ open, mode, initialData, onClose, onSubmit, timezone }) => {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    vendor_id: "",
    vendor: "",
    price: "",
    cost: "",
    moq: "",
    qty: "",
    upc: "",
    asin: "",
    lead_time: "",
    exp_date: "",
    fob: "",
    image_url: "",
    out_of_stock: false,
    amazon_url: "",
    walmart_url: "",
    ebay_url: "",
    offer_date: "",
    last_sent: "",
    sales_per_month: "",
    net: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        category: initialData.category || "",
        vendor_id: initialData.vendor_id || "",
        vendor: initialData.vendor || "",
        price: initialData.price || "",
        cost: initialData.cost || "",
        moq: initialData.moq || "",
        qty: initialData.qty || "",
        upc: initialData.upc || "",
        asin: initialData.asin || "",
        lead_time: initialData.lead_time || "",
        exp_date: initialData.exp_date || "",
        fob: initialData.fob || "",
        image_url: initialData.image_url || "",
        out_of_stock: initialData.out_of_stock || false,
        amazon_url: initialData.amazon_url || "",
        walmart_url: initialData.walmart_url || "",
        ebay_url: initialData.ebay_url || "",
        offer_date: initialData.offer_date ? new Date(initialData.offer_date).toISOString().split('T')[0] : "",
        last_sent: initialData.last_sent ? new Date(initialData.last_sent).toISOString().split('T')[0] : "",
        sales_per_month: initialData.sales_per_month || "",
        net: initialData.net || "",
      });
    } else {
      setFormData({
        title: "",
        category: "",
        vendor_id: "",
        vendor: "",
        price: "",
        cost: "",
        moq: "",
        qty: "",
        upc: "",
        asin: "",
        lead_time: "",
        exp_date: "",
        fob: "",
        image_url: "",
        out_of_stock: false,
        amazon_url: "",
        walmart_url: "",
        ebay_url: "",
        offer_date: "",
        last_sent: "",
        sales_per_month: "",
        net: "",
      });
    }
  }, [initialData, open]);

  useEffect(() => {
    if (!open) {
      localStorage.removeItem("productFormData"); // Clear saved form data when dialog closes
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;
    // Handle numeric fields
    if (["price", "cost", "net"].includes(name)) {
      newValue = value === "" ? "" : parseFloat(value);
    }
    // Handle integer fields
    if (["moq", "qty", "sales_per_month"].includes(name)) {
      newValue = value === "" ? "" : parseInt(value, 10);
    }
    const newFormData = {
      ...formData,
      [name]: newValue,
    };
    setFormData(newFormData);
    console.log(`Form field updated: ${name} = ${newValue}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    // Convert empty strings to null for numeric fields before submitting
    const submitData = {
      ...formData,
      price: formData.price === "" ? null : formData.price,
      cost: formData.cost === "" ? null : formData.cost,
      moq: formData.moq === "" ? null : formData.moq,
      qty: formData.qty === "" ? null : formData.qty,
      sales_per_month: formData.sales_per_month === "" ? null : formData.sales_per_month,
      net: formData.net === "" ? null : formData.net,
    };
    onSubmit(submitData);
  };

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{mode === "add" ? "Add Product" : "Edit Product"}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <TextField
            fullWidth
            margin="dense"
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
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
          <TextField
            fullWidth
            margin="dense"
            label="Vendor ID"
            name="vendor_id"
            value={formData.vendor_id}
            onChange={handleChange}
            placeholder="Enter Vendor ID (e.g., V123, 12345)"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Vendor"
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
          />
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
          <TextField
            fullWidth
            margin="dense"
            label="Cost"
            name="cost"
            value={formData.cost}
            onChange={handleChange}
            type="number"
            InputProps={{ inputProps: { min: 0, step: "0.01" } }}
            onWheel={(e) => e.target.blur()}
          />
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
          <TextField
            fullWidth
            margin="dense"
            label="UPC"
            name="upc"
            value={formData.upc}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="dense"
            label="ASIN"
            name="asin"
            value={formData.asin}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Lead Time"
            name="lead_time"
            value={formData.lead_time}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Exp Date"
            name="exp_date"
            value={formData.exp_date}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="dense"
            label="FOB"
            name="fob"
            value={formData.fob}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Image URL"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Amazon URL"
            name="amazon_url"
            value={formData.amazon_url}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Walmart URL"
            name="walmart_url"
            value={formData.walmart_url}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="dense"
            label="eBay URL"
            name="ebay_url"
            value={formData.ebay_url}
            onChange={handleChange}
          />
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
          <TextField
            fullWidth
            margin="dense"
            label="Sales Per Month"
            name="sales_per_month"
            value={formData.sales_per_month}
            onChange={handleChange}
            type="number"
            InputProps={{ inputProps: { min: 0 } }}
            onWheel={(e) => e.target.blur()}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Net"
            name="net"
            value={formData.net}
            onChange={handleChange}
            type="number"
            InputProps={{ inputProps: { min: 0, step: "0.01" } }}
            onWheel={(e) => e.target.blur()}
          />
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
