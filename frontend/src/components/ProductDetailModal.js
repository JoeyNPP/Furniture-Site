import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  TextField,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import EmailIcon from "@mui/icons-material/Email";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import StraightenIcon from "@mui/icons-material/Straighten";
import ScaleIcon from "@mui/icons-material/Scale";
import BuildIcon from "@mui/icons-material/Build";
import VerifiedIcon from "@mui/icons-material/Verified";
import ProductImageGallery from "./ProductImageGallery";

const ProductDetailModal = ({
  open,
  onClose,
  product,
  onAddToQuote,
  isSelected,
  selectedQty,
  onQtyChange,
}) => {
  const [localQty, setLocalQty] = useState(selectedQty || product?.moq || 1);

  if (!product) return null;

  const {
    title,
    price,
    moq,
    qty,
    category,
    vendor,
    fob,
    image_url,
    secondary_images,
    room_type,
    style,
    material,
    color,
    brand,
    width,
    depth,
    height,
    weight,
    condition,
    warranty,
    assembly_required,
    features,
    lead_time,
    sku,
    upc,
  } = product;

  const dealCost = (parseFloat(price) || 0) * (parseInt(moq) || 1);
  const hasDimensions = width || depth || height;
  const hasFeatures = features && features.length > 0;

  const handleAddToQuote = () => {
    onAddToQuote(product, localQty);
  };

  const generateEmailLink = () => {
    const totalCost = (parseFloat(price) || 0) * localQty;
    const subject = encodeURIComponent(`Quote Request: ${title}`);
    const body = encodeURIComponent(
      `Hi NPP Office Furniture Team,\n\n` +
      `I would like to request a quote for:\n\n` +
      `Product: ${title}\n` +
      `SKU: ${sku || "N/A"}\n` +
      `Quantity: ${localQty}\n` +
      `Unit Price: $${price}\n` +
      `Total: $${totalCost.toLocaleString()}\n\n` +
      `Please send me a quote at your earliest convenience.\n\n` +
      `Thank you!`
    );
    return `mailto:sales@npp-office-furniture.com?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: "90vh" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#003087", pr: 4 }}>
            {title}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
            {category && <Chip label={category} size="small" color="primary" variant="outlined" />}
            {room_type && <Chip label={room_type} size="small" sx={{ bgcolor: "#e3f2fd" }} />}
            {style && <Chip label={style} size="small" sx={{ bgcolor: "#f3e5f5" }} />}
            {condition && (
              <Chip
                label={condition}
                size="small"
                color={condition === "New" ? "success" : condition === "Refurbished" ? "warning" : "default"}
              />
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ mt: -1, mr: -1 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Left Column - Images */}
          <Grid item xs={12} md={6}>
            <ProductImageGallery
              mainImage={image_url}
              secondaryImages={secondary_images}
              title={title}
              height={400}
              showThumbnails={true}
              enableZoom={true}
            />
          </Grid>

          {/* Right Column - Details */}
          <Grid item xs={12} md={6}>
            {/* Pricing Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ color: "#003087", fontWeight: 700 }}>
                ${parseFloat(price).toLocaleString()}
                <Typography component="span" variant="body1" sx={{ color: "#666", ml: 1 }}>
                  per unit
                </Typography>
              </Typography>
              <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
                MOQ: {moq} units
              </Typography>
            </Box>

            {/* Stock & Shipping */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              <Chip
                icon={<InventoryIcon />}
                label={qty > 0 ? `${qty} in stock` : "Out of Stock"}
                color={qty > 0 ? "success" : "error"}
                variant="outlined"
              />
              {fob && (
                <Chip
                  icon={<LocalShippingIcon />}
                  label={`FOB: ${fob}`}
                  variant="outlined"
                />
              )}
              {lead_time && (
                <Chip
                  label={`Lead Time: ${lead_time}`}
                  variant="outlined"
                  sx={{ borderColor: "#ff9800", color: "#f57c00" }}
                />
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Quantity & Actions */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Quantity
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <TextField
                  type="number"
                  value={localQty}
                  onChange={(e) => setLocalQty(Math.max(moq || 1, parseInt(e.target.value) || 1))}
                  inputProps={{ min: moq || 1 }}
                  size="small"
                  sx={{ width: 100 }}
                />
                <Typography variant="body2" sx={{ color: "#666" }}>
                  Total: <strong>${((parseFloat(price) || 0) * localQty).toLocaleString()}</strong>
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<ShoppingCartIcon />}
                onClick={handleAddToQuote}
                fullWidth
                sx={{ py: 1.5 }}
              >
                {isSelected ? "Update Quote" : "Add to Quote"}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<EmailIcon />}
                href={generateEmailLink()}
                sx={{ py: 1.5, minWidth: 150 }}
              >
                Email
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Product Specifications */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#003087" }}>
              Specifications
            </Typography>

            <Table size="small">
              <TableBody>
                {brand && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 140, border: "none", py: 0.75 }}>Brand</TableCell>
                    <TableCell sx={{ border: "none", py: 0.75 }}>{brand}</TableCell>
                  </TableRow>
                )}
                {vendor && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: "none", py: 0.75 }}>Vendor</TableCell>
                    <TableCell sx={{ border: "none", py: 0.75 }}>{vendor}</TableCell>
                  </TableRow>
                )}
                {material && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: "none", py: 0.75 }}>Material</TableCell>
                    <TableCell sx={{ border: "none", py: 0.75 }}>{material}</TableCell>
                  </TableRow>
                )}
                {color && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: "none", py: 0.75 }}>Color</TableCell>
                    <TableCell sx={{ border: "none", py: 0.75 }}>{color}</TableCell>
                  </TableRow>
                )}
                {hasDimensions && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: "none", py: 0.75 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <StraightenIcon fontSize="small" /> Dimensions
                      </Box>
                    </TableCell>
                    <TableCell sx={{ border: "none", py: 0.75 }}>
                      {[
                        width && `${width}"W`,
                        depth && `${depth}"D`,
                        height && `${height}"H`,
                      ]
                        .filter(Boolean)
                        .join(" x ")}
                    </TableCell>
                  </TableRow>
                )}
                {weight && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: "none", py: 0.75 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <ScaleIcon fontSize="small" /> Weight
                      </Box>
                    </TableCell>
                    <TableCell sx={{ border: "none", py: 0.75 }}>{weight} lbs</TableCell>
                  </TableRow>
                )}
                {assembly_required !== undefined && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: "none", py: 0.75 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <BuildIcon fontSize="small" /> Assembly
                      </Box>
                    </TableCell>
                    <TableCell sx={{ border: "none", py: 0.75 }}>
                      {assembly_required ? "Required" : "Ready to use"}
                    </TableCell>
                  </TableRow>
                )}
                {warranty && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: "none", py: 0.75 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <VerifiedIcon fontSize="small" /> Warranty
                      </Box>
                    </TableCell>
                    <TableCell sx={{ border: "none", py: 0.75 }}>{warranty}</TableCell>
                  </TableRow>
                )}
                {sku && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: "none", py: 0.75 }}>SKU</TableCell>
                    <TableCell sx={{ border: "none", py: 0.75 }}>{sku}</TableCell>
                  </TableRow>
                )}
                {upc && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: "none", py: 0.75 }}>UPC</TableCell>
                    <TableCell sx={{ border: "none", py: 0.75 }}>{upc}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Features */}
            {hasFeatures && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: "#003087" }}>
                  Features
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {features.map((feature, index) => (
                    <Chip key={index} label={feature} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
