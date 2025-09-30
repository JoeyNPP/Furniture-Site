import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Login from "./components/Login";
import InternalProductList from "./components/InternalProductList";
import { Box } from "@mui/material";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const App = () => {
  return (
    <Router>
      <Box sx={{ p: 2 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <InternalProductList />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Box>
    </Router>
  );
};

export default App;
