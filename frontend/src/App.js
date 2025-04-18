import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import InternalProductList from "./components/InternalProductList";
import { Box } from "@mui/material";

const App = () => {
  return (
    <Router>
      <Box sx={{ p: 2 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/products" element={<InternalProductList />} />
          <Route path="/" element={<InternalProductList />} />
        </Routes>
      </Box>
    </Router>
  );
};

export default App;
