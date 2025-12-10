import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Chip,
} from "@mui/material";
import { fetchProducts } from "../api";
import { SettingsContext } from "../settings/SettingsContext";

const VendorPerformance = ({ onBack }) => {
  const { settings } = useContext(SettingsContext);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      setLoading(true);
      const response = await fetchProducts();
      const products = response.products || [];

      // Group products by vendor
      const vendorMap = {};
      products.forEach((product) => {
        const vendorName = product.vendor || "Unknown";
        if (!vendorMap[vendorName]) {
          vendorMap[vendorName] = {
            name: vendorName,
            totalProducts: 0,
            activeProducts: 0,
            outOfStock: 0,
            leadTimes: [],
            moqs: [],
          };
        }

        vendorMap[vendorName].totalProducts++;
        if (!product.out_of_stock) {
          vendorMap[vendorName].activeProducts++;
        } else {
          vendorMap[vendorName].outOfStock++;
        }

        if (product.lead_time) {
          vendorMap[vendorName].leadTimes.push(product.lead_time);
        }
        if (product.moq) {
          vendorMap[vendorName].moqs.push(parseInt(product.moq, 10));
        }
      });

      // Calculate averages and format data
      const vendorStats = Object.values(vendorMap).map((vendor) => {
        const avgMOQ = vendor.moqs.length > 0
          ? Math.round(vendor.moqs.reduce((a, b) => a + b, 0) / vendor.moqs.length)
          : 0;

        // Get most common lead time
        const leadTimeFreq = {};
        vendor.leadTimes.forEach((lt) => {
          leadTimeFreq[lt] = (leadTimeFreq[lt] || 0) + 1;
        });
        const commonLeadTime = Object.keys(leadTimeFreq).length > 0
          ? Object.keys(leadTimeFreq).reduce((a, b) => leadTimeFreq[a] > leadTimeFreq[b] ? a : b)
          : "N/A";

        return {
          ...vendor,
          avgMOQ,
          commonLeadTime,
          activeRate: vendor.totalProducts > 0
            ? Math.round((vendor.activeProducts / vendor.totalProducts) * 100)
            : 0,
        };
      });

      // Sort by total products (most active vendors first)
      vendorStats.sort((a, b) => b.totalProducts - a.totalProducts);

      setVendors(vendorStats);
      setLoading(false);
    } catch (error) {
      console.error("Error loading vendor data:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Vendor Performance Tracking
        </Typography>
        {onBack && (
          <Button variant="outlined" onClick={onBack}>
            Back to Products
          </Button>
        )}
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View performance metrics and statistics for all your vendors.
      </Typography>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: settings.theme === "dark" ? "#1e1e1e" : "#f5f5f5" }}>
              <TableCell><strong>Vendor</strong></TableCell>
              <TableCell align="center"><strong>Total Products</strong></TableCell>
              <TableCell align="center"><strong>Active</strong></TableCell>
              <TableCell align="center"><strong>Out of Stock</strong></TableCell>
              <TableCell align="center"><strong>Active Rate</strong></TableCell>
              <TableCell align="center"><strong>Avg MOQ</strong></TableCell>
              <TableCell align="center"><strong>Common Lead Time</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.name} hover>
                <TableCell>
                  <Typography variant="body1" fontWeight={600}>
                    {vendor.name}
                  </Typography>
                </TableCell>
                <TableCell align="center">{vendor.totalProducts}</TableCell>
                <TableCell align="center">
                  <Chip label={vendor.activeProducts} color="success" size="small" />
                </TableCell>
                <TableCell align="center">
                  <Chip label={vendor.outOfStock} color="error" size="small" />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${vendor.activeRate}%`}
                    color={vendor.activeRate >= 70 ? "success" : vendor.activeRate >= 40 ? "warning" : "error"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">{vendor.avgMOQ.toLocaleString()}</TableCell>
                <TableCell align="center">{vendor.commonLeadTime}</TableCell>
              </TableRow>
            ))}
            {vendors.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No vendor data available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VendorPerformance;
