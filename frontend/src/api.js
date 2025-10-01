import jwtDecode from "jwt-decode"; // Compatible with jwt-decode@3.x

export const API_BASE_URL = process.env.REACT_APP_FRONTEND_URL || "http://159.65.184.143:8000";

const withAuthHeaders = (token, extra = {}) => ({
  Authorization: `Bearer ${token}`,
  ...extra,
});

async function login(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ username, password }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Login failed for ${username}:`, error);
    throw error;
  }
}

function requireToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token not found");
  }
  return token;
}

async function fetchProducts() {
  const token = requireToken();
  try {
    const decodedToken = jwtDecode(token);
    console.debug("Fetching products with token exp:", decodedToken.exp);
    const response = await fetch(`${API_BASE_URL}/products`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch products error:", error);
    throw error;
  }
}

async function createProduct(data) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Create product error:", error);
    throw error;
  }
}

async function updateProduct(id, data) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PATCH",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Update product error for ID ${id}:`, error);
    throw error;
  }
}

async function deleteProduct(id) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Delete product error for ID ${id}:`, error);
    throw error;
  }
}

async function markOutOfStock(id) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}/mark-out-of-stock`, {
      method: "POST",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Mark out-of-stock error for ID ${id}:`, error);
    throw error;
  }
}

async function uploadProducts(file) {
  const token = requireToken();
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE_URL}/products/import`, {
      method: "POST",
      headers: withAuthHeaders(token),
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Upload products error:", error);
    throw error;
  }
}

async function searchProducts(query) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products/search?query=${encodeURIComponent(query)}`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Search products error for query '${query}':`, error);
    throw error;
  }
}

export async function fetchUserSettings() {
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/user/settings`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch user settings error:", error);
    return null;
  }
}

export async function persistUserSettings(nextSettings) {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }
  const options = {
    headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(nextSettings),
  };
  try {
    let response = await fetch(`${API_BASE_URL}/user/settings`, {
      method: "PATCH",
      ...options,
    });
    if (response.status === 404) {
      response = await fetch(`${API_BASE_URL}/user/settings`, {
        method: "POST",
        ...options,
      });
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error("Persist user settings error:", error);
  }
}

export {
  login,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  markOutOfStock,
  searchProducts,
  uploadProducts,
};
