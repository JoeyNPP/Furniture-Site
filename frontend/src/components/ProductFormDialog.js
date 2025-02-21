import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

// Default options for the dropdown fields
const defaultCategories = [
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
  "Camera & Photo"
];

const defaultVendors = [
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
  "Royal"
];

const defaultLeadTimes = [
  "7-10 Days",
  "10-14 Days",
  "14-21 Days",
  "Business Days"
];

const defaultFOBs = [
  "FOB NJ",
  "FOB LA",
  "FOB SH",
  "FOB China"
];

const ProductFormDialog = ({
  open,
  mode = "add",
  initialData = {},
  onClose,
  onSubmit
}) => {
  // Local state for product fields (including our new timestamp fields)
  const [formState, setFormState] = useState({
    title: "",
    category: "",
    vendor: "",
    price: "",
    moq: "",
    qty: "",
    upc: "",
    cost: "",
    lead_time: "",
    exp_date: "",
    fob: "",
    vendor_id: "",
    profit_moq: "",
    image_url: "",
    out_of_stock: false,
    walmart_url: "",
    ebay_url: "",
    amazon_url: "",
    asin: "",
    // Timestamp fields
    offer_date: "",
    last_sent: ""
  });

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormState({
        title: initialData.title || "",
        category: initialData.category || "",
        vendor: initialData.vendor || "",
        price: initialData.price || "",
        moq: initialData.moq || "",
        qty: initialData.qty || "",
        upc: initialData.upc || "",
        cost: initialData.cost || "",
        lead_time: initialData.lead_time ? String(initialData.lead_time) : "",
        exp_date: initialData.exp_date || "",
        fob: initialData.fob || "",
        vendor_id: initialData.vendor_id || "",
        profit_moq: initialData.profit_moq || "",
        image_url: initialData.image_url || "",
        out_of_stock: !!initialData.out_of_stock,
        walmart_url: initialData.walmart_url || "",
        ebay_url: initialData.ebay_url || "",
        amazon_url: initialData.amazon_url || "",
        asin: initialData.asin || "",
        offer_date: initialData.offer_date || "",
        last_sent: initialData.last_sent || ""
      });
    } else {
      setFormState({
        title: "",
        category: "",
        vendor: "",
        price: "",
        moq: "",
        qty: "",
        upc: "",
        cost: "",
        lead_time: "",
        exp_date: "",
        fob: "",
        vendor_id: "",
        profit_moq: "",
        image_url: "",
        out_of_stock: false,
        walmart_url: "",
        ebay_url: "",
        amazon_url: "",
        asin: "",
        offer_date: "",
        last_sent: ""
      });
    }
  }, [mode, initialData]);

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Handle saving the form data
  const handleSave = () => {
    // Convert numeric and date/time fields before submitting
    const productData = {
      ...formState,
      price: formState.price ? parseFloat(formState.price) : null,
      cost: formState.cost ? parseFloat(formState.cost) : null,
      moq: formState.moq ? parseInt(formState.moq, 10) : 0,
      qty: formState.qty ? parseInt(formState.qty, 10) : 0,
      profit_moq: formState.profit_moq ? parseFloat(formState.profit_moq) : null,
      // Convert date strings to ISO or null if needed (you can add parsing logic here)
      offer_date: formState.offer_date,
      last_sent: formState.last_sent
    };
    onSubmit(productData);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {mode === "edit" ? "Edit Product" : "Add Product"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Title"
            value={formState.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
          />
          <Stack direction="row" spacing={2}>
            {/* Category dropdown with freeSolo */}
            <Autocomplete
              freeSolo
              options={defaultCategories}
              value={formState.category}
              onChange={(e, newValue) => handleChange("category", newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Category" />
              )}
              fullWidth
            />
            {/* Vendor dropdown with freeSolo */}
            <Autocomplete
              freeSolo
              options={defaultVendors}
              value={formState.vendor}
              onChange={(e, newValue) => handleChange("vendor", newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Vendor" />
              )}
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            {/* Lead Time dropdown with freeSolo */}
            <Autocomplete
              freeSolo
              options={defaultLeadTimes}
              value={formState.lead_time}
              onChange={(e, newValue) => handleChange("lead_time", newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Lead Time" />
              )}
              fullWidth
            />
            {/* FOB dropdown with freeSolo */}
            <Autocomplete
              freeSolo
              options={defaultFOBs}
              value={formState.fob}
              onChange={(e, newValue) => handleChange("fob", newValue)}
              renderInput={(params) => (
                <TextField {...params} label="FOB" />
              )}
              fullWidth
            />
          </Stack>
          {/* The rest of the fields remain as TextField components */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="Price"
              type="number"
              value={formState.price}
              onChange={(e) => handleChange("price", e.target.value)}
            />
            <TextField
              label="Cost"
              type="number"
              value={formState.cost}
              onChange={(e) => handleChange("cost", e.target.value)}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="MOQ"
              type="number"
              value={formState.moq}
              onChange={(e) => handleChange("moq", e.target.value)}
            />
            <TextField
              label="Qty"
              type="number"
              value={formState.qty}
              onChange={(e) => handleChange("qty", e.target.value)}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="UPC"
              value={formState.upc}
              onChange={(e) => handleChange("upc", e.target.value)}
            />
            <TextField
              label="ASIN"
              value={formState.asin}
              onChange={(e) => handleChange("asin", e.target.value)}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Exp Date"
              value={formState.exp_date}
              onChange={(e) => handleChange("exp_date", e.target.value)}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Image URL"
              value={formState.image_url}
              onChange={(e) => handleChange("image_url", e.target.value)}
            />
          </Stack>
          <FormControl fullWidth>
            <TextField
              label="Amazon URL"
              value={formState.amazon_url}
              onChange={(e) => handleChange("amazon_url", e.target.value)}
            />
          </FormControl>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Walmart URL"
              value={formState.walmart_url}
              onChange={(e) => handleChange("walmart_url", e.target.value)}
            />
            <TextField
              label="eBay URL"
              value={formState.ebay_url}
              onChange={(e) => handleChange("ebay_url", e.target.value)}
            />
          </Stack>
          {/* Timestamps (optional) */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="Offer Date (YYYY-MM-DD HH:MM)"
              value={formState.offer_date}
              onChange={(e) => handleChange("offer_date", e.target.value)}
              helperText="When this product was first offered."
            />
            <TextField
              label="Last Sent (YYYY-MM-DD HH:MM)"
              value={formState.last_sent}
              onChange={(e) => handleChange("last_sent", e.target.value)}
              helperText="Most recent time an email was sent."
            />
          </Stack>
          {/* Out of stock dropdown */}
          <FormControl fullWidth>
            <TextField
              label="Out of Stock? (yes/no)"
              value={formState.out_of_stock ? "yes" : "no"}
              onChange={(e) =>
                handleChange("out_of_stock", e.target.value === "yes")
              }
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          {mode === "edit" ? "Save Changes" : "Add Product"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductFormDialog;
