import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Box, Typography, Container } from "@mui/material";
import { login } from "../api";

const Login = () => {
  const [username, setUsername] = useState("joey"); // Default to commonly used account
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Use the intended username if form input is empty or invalid, otherwise use input
    const finalUsername = username.trim() === "" ? "joey" : username.trim();
    try {
      const response = await login(finalUsername, password);
      const { access_token } = response;
      if (access_token) {
        localStorage.setItem("token", access_token);
        navigate("/products");
      } else {
        setError("Login failed: No token received");
      }
    } catch (err) {
      setError("Login failed: " + err.message);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Box
          component="img"
          src="/assets/logo.png"
          alt="NPP Office Furniture"
          sx={{ height: 80, mb: 2, objectFit: "contain" }}
        />
        <Typography component="h1" variant="h5" sx={{ color: "#003087", fontWeight: 600 }}>
          Admin Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            helperText="Use username 'joey' or 'alex'"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;