import React from "react";
import { Box, Typography, Button } from "@mui/material";

const PublicProductList = ({ onManage }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Public Product List</Typography>
      <Button variant="contained" onClick={onManage}>
        Manage Products
      </Button>
    </Box>
  );
};

export default PublicProductList;
