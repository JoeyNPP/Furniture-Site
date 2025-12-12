import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Stack,
  Typography,
  Box,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import RestoreIcon from "@mui/icons-material/Restore";

// Tab Panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

// Column groups for easier management
const COLUMN_GROUPS = {
  "Product Info": ["title", "category", "brand", "sku", "upc"],
  "Pricing & Stock": ["price", "moq", "qty", "condition"],
  "Vendor & Shipping": ["vendor", "vendor_id", "fob", "lead_time"],
  "Furniture Details": ["material", "color", "room_type", "style", "dimensions", "width", "depth", "height", "weight", "warranty", "assembly_required"],
  "Dates": ["offer_date", "last_sent", "exp_date", "date_added"],
  "Other": ["image_url", "out_of_stock"],
};

// Default column visibility
const DEFAULT_COLUMN_VISIBILITY = {
  title: true,
  category: true,
  brand: true,
  vendor: true,
  price: true,
  moq: true,
  qty: true,
  sku: true,
  lead_time: true,
  fob: true,
  condition: true,
  // Hidden by default
  vendor_id: false,
  upc: false,
  exp_date: false,
  color: false,
  material: false,
  room_type: false,
  style: false,
  width: false,
  depth: false,
  height: false,
  dimensions: false,
  weight: false,
  warranty: false,
  assembly_required: false,
  offer_date: false,
  last_sent: false,
  date_added: false,
  image_url: false,
  out_of_stock: false,
};

const SettingsDialog = ({
  open,
  onClose,
  settings,
  updateSettings,
  columns = [],
  columnVisibilityModel = {},
  onColumnVisibilityChange,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [localSettings, setLocalSettings] = useState(settings);
  const [localColumnVisibility, setLocalColumnVisibility] = useState(columnVisibilityModel);

  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
      setLocalColumnVisibility(columnVisibilityModel);
    }
  }, [settings, columnVisibilityModel, open]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Display settings handlers
  const handleThemeChange = (event) => {
    setLocalSettings((prev) => ({ ...prev, theme: event.target.value }));
  };

  const handleTextScaleChange = (event, value) => {
    setLocalSettings((prev) => ({ ...prev, textScale: value }));
  };

  const handleRowDensityChange = (event) => {
    setLocalSettings((prev) => ({ ...prev, rowDensity: event.target.value }));
  };

  const handleToggleSetting = (setting) => (event) => {
    setLocalSettings((prev) => ({ ...prev, [setting]: event.target.checked }));
  };

  const handleSelectChange = (setting) => (event) => {
    setLocalSettings((prev) => ({ ...prev, [setting]: event.target.value }));
  };

  // Column visibility handlers
  const handleToggleColumn = (field) => {
    setLocalColumnVisibility((prev) => ({
      ...prev,
      [field]: prev[field] === false ? true : false,
    }));
  };

  const handleShowAllColumns = () => {
    const allVisible = {};
    columns.forEach((col) => {
      allVisible[col.field] = true;
    });
    setLocalColumnVisibility(allVisible);
  };

  const handleHideAllColumns = () => {
    const allHidden = {};
    columns.forEach((col) => {
      // Keep title visible always
      allHidden[col.field] = col.field === "title";
    });
    setLocalColumnVisibility(allHidden);
  };

  const handleResetColumns = () => {
    setLocalColumnVisibility(DEFAULT_COLUMN_VISIBILITY);
  };

  const handleToggleGroup = (groupName) => {
    const groupFields = COLUMN_GROUPS[groupName] || [];
    const availableFields = groupFields.filter((field) =>
      columns.some((col) => col.field === field)
    );
    const visibleCount = availableFields.filter(
      (field) => localColumnVisibility[field] !== false
    ).length;
    const shouldShow = visibleCount < availableFields.length / 2;

    setLocalColumnVisibility((prev) => {
      const updated = { ...prev };
      availableFields.forEach((field) => {
        updated[field] = shouldShow;
      });
      return updated;
    });
  };

  const handleSave = () => {
    // Save display settings
    updateSettings({
      ...localSettings,
      columnVisibility: localColumnVisibility,
    });

    // Save column visibility if handler provided
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(localColumnVisibility);
    }

    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    setLocalSettings(settings);
    setLocalColumnVisibility(columnVisibilityModel);
    onClose();
  };

  // Count visible columns
  const visibleColumnCount = columns.filter(
    (col) => localColumnVisibility[col.field] !== false
  ).length;
  const totalColumnCount = columns.length;

  // Get column label by field
  const getColumnLabel = (field) => {
    const col = columns.find((c) => c.field === field);
    return col?.headerName || field;
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 0 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Display & Settings
        </Typography>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Display" />
          <Tab label="Columns" />
          <Tab label="Behavior" />
        </Tabs>
      </Box>

      <DialogContent sx={{ minHeight: 400 }}>
        {/* Display Tab */}
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            {/* Theme */}
            <FormControl fullWidth>
              <InputLabel id="settings-theme-label">Theme</InputLabel>
              <Select
                labelId="settings-theme-label"
                value={localSettings.theme || "light"}
                label="Theme"
                onChange={handleThemeChange}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
              </Select>
            </FormControl>

            {/* Text Scale */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Text Scale: {((localSettings.textScale || 1) * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={localSettings.textScale || 1}
                min={0.75}
                max={1.5}
                step={0.05}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
                onChange={handleTextScaleChange}
                marks={[
                  { value: 0.75, label: "75%" },
                  { value: 1, label: "100%" },
                  { value: 1.5, label: "150%" },
                ]}
              />
            </Box>

            {/* Row Density */}
            <FormControl fullWidth>
              <InputLabel id="row-density-label">Row Density</InputLabel>
              <Select
                labelId="row-density-label"
                value={localSettings.rowDensity || "standard"}
                label="Row Density"
                onChange={handleRowDensityChange}
              >
                <MenuItem value="compact">Compact</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="comfortable">Comfortable</MenuItem>
              </Select>
            </FormControl>

            <Divider />

            {/* Visual Options */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Visual Options
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.showGridLines !== false}
                  onChange={handleToggleSetting("showGridLines")}
                />
              }
              label="Show grid lines"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.highlightExpiring !== false}
                  onChange={handleToggleSetting("highlightExpiring")}
                />
              }
              label="Highlight expiring products"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.highlightOutOfStock !== false}
                  onChange={handleToggleSetting("highlightOutOfStock")}
                />
              }
              label="Highlight out-of-stock products"
            />
          </Stack>
        </TabPanel>

        {/* Columns Tab */}
        <TabPanel value={tabValue} index={1}>
          <Stack spacing={2}>
            {/* Quick Actions */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                {visibleColumnCount} of {totalColumnCount} columns visible
              </Typography>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Show All">
                  <IconButton size="small" onClick={handleShowAllColumns}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Hide All">
                  <IconButton size="small" onClick={handleHideAllColumns}>
                    <VisibilityOffIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reset to Defaults">
                  <IconButton size="small" onClick={handleResetColumns}>
                    <RestoreIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            <Divider />

            {/* Column Groups */}
            {Object.entries(COLUMN_GROUPS).map(([groupName, groupFields]) => {
              const availableFields = groupFields.filter((field) =>
                columns.some((col) => col.field === field)
              );
              if (availableFields.length === 0) return null;

              const visibleInGroup = availableFields.filter(
                (field) => localColumnVisibility[field] !== false
              ).length;

              return (
                <Box key={groupName}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                      p: 1,
                      borderRadius: 1,
                    }}
                    onClick={() => handleToggleGroup(groupName)}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {groupName}
                    </Typography>
                    <Chip
                      label={`${visibleInGroup}/${availableFields.length}`}
                      size="small"
                      color={visibleInGroup === availableFields.length ? "success" : "default"}
                    />
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, ml: 2 }}>
                    {availableFields.map((field) => (
                      <Chip
                        key={field}
                        label={getColumnLabel(field)}
                        onClick={() => handleToggleColumn(field)}
                        color={localColumnVisibility[field] !== false ? "primary" : "default"}
                        variant={localColumnVisibility[field] !== false ? "filled" : "outlined"}
                        size="small"
                        sx={{ cursor: "pointer" }}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </TabPanel>

        {/* Behavior Tab */}
        <TabPanel value={tabValue} index={2}>
          <Stack spacing={3}>
            <Alert severity="info" sx={{ mb: 2 }}>
              These settings control default behaviors when you open the admin panel.
            </Alert>

            {/* Default Stock Filter */}
            <FormControl fullWidth>
              <InputLabel id="default-stock-filter-label">Default Stock Filter</InputLabel>
              <Select
                labelId="default-stock-filter-label"
                value={localSettings.defaultStockFilter || "in"}
                label="Default Stock Filter"
                onChange={handleSelectChange("defaultStockFilter")}
              >
                <MenuItem value="all">Show All Products</MenuItem>
                <MenuItem value="in">In Stock Only</MenuItem>
                <MenuItem value="out">Out of Stock Only</MenuItem>
              </Select>
            </FormControl>

            {/* Auto Refresh */}
            <FormControl fullWidth>
              <InputLabel id="auto-refresh-label">Auto Refresh</InputLabel>
              <Select
                labelId="auto-refresh-label"
                value={localSettings.autoRefreshInterval || 0}
                label="Auto Refresh"
                onChange={handleSelectChange("autoRefreshInterval")}
              >
                <MenuItem value={0}>Disabled</MenuItem>
                <MenuItem value={1}>Every 1 minute</MenuItem>
                <MenuItem value={5}>Every 5 minutes</MenuItem>
                <MenuItem value={15}>Every 15 minutes</MenuItem>
                <MenuItem value={30}>Every 30 minutes</MenuItem>
              </Select>
            </FormControl>

            <Divider />

            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Default Sorting
            </Typography>

            {/* Default Sort Column */}
            <FormControl fullWidth>
              <InputLabel id="default-sort-column-label">Sort By</InputLabel>
              <Select
                labelId="default-sort-column-label"
                value={localSettings.defaultSortColumn || "offer_date"}
                label="Sort By"
                onChange={handleSelectChange("defaultSortColumn")}
              >
                <MenuItem value="offer_date">Offer Date</MenuItem>
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="brand">Brand</MenuItem>
                <MenuItem value="vendor">Vendor</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="qty">Quantity</MenuItem>
                <MenuItem value="sku">SKU</MenuItem>
                <MenuItem value="date_added">Date Added</MenuItem>
                <MenuItem value="exp_date">Expiration Date</MenuItem>
              </Select>
            </FormControl>

            {/* Default Sort Direction */}
            <FormControl fullWidth>
              <InputLabel id="default-sort-direction-label">Sort Direction</InputLabel>
              <Select
                labelId="default-sort-direction-label"
                value={localSettings.defaultSortDirection || "desc"}
                label="Sort Direction"
                onChange={handleSelectChange("defaultSortDirection")}
              >
                <MenuItem value="asc">Ascending (A→Z, Low→High, Oldest→Newest)</MenuItem>
                <MenuItem value="desc">Descending (Z→A, High→Low, Newest→Oldest)</MenuItem>
              </Select>
            </FormControl>

            <Divider />

            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Confirmations
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.confirmBeforeDelete !== false}
                  onChange={handleToggleSetting("confirmBeforeDelete")}
                />
              }
              label="Confirm before deleting products"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.confirmBeforeBulkActions !== false}
                  onChange={handleToggleSetting("confirmBeforeBulkActions")}
                />
              }
              label="Confirm before bulk actions"
            />

            <Divider />

            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Display Extras
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.showProductCount !== false}
                  onChange={handleToggleSetting("showProductCount")}
                />
              }
              label="Show product count in header"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.showSelectedCount !== false}
                  onChange={handleToggleSetting("showSelectedCount")}
                />
              }
              label="Show selected count in toolbar"
            />
          </Stack>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
