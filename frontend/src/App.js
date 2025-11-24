import React, { useContext, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./components/Login";
import InternalProductList from "./components/InternalProductList";
import CategoryPage from "./components/CategoryPage";
import Catalog from "./components/Catalog";
import { Box, CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SettingsContext } from "./settings/SettingsContext";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  const { settings } = useContext(SettingsContext);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: settings.theme || "light",
        },
      }),
    [settings.theme]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <InternalProductList />
              </ProtectedRoute>
            }
          />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Box>
    </ThemeProvider>
  );
}

export default App;
