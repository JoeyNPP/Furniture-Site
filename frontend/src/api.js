import jwtDecode from "jwt-decode"; // Compatible with jwt-decode@3.x

export const API_BASE_URL = "/api";

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

async function fetchPublicProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products/public`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch public products error:", error);
    throw error;
  }
}

async function fetchProductFilters() {
  try {
    const response = await fetch(`${API_BASE_URL}/products/filters`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch product filters error:", error);
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

async function fetchProductsByCategory(category) {
  const token = localStorage.getItem("token");
  const headers = token ? withAuthHeaders(token) : {};
  try {
    const response = await fetch(`${API_BASE_URL}/products/category/${encodeURIComponent(category)}`, {
      headers,
    });
    if (!response.ok) {
      if (response.status === 404) {
        return { category, products: [] };
      }
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Fetch products by category failed for ${category}:`, error);
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

async function checkDuplicate(sku, upc) {
  const token = requireToken();
  try {
    const params = new URLSearchParams();
    if (sku) params.append("sku", sku);
    if (upc) params.append("upc", upc);
    const response = await fetch(`${API_BASE_URL}/products/check-duplicate?${params}`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Check duplicate error:", error);
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

async function requestInvoice(customerInfo, productIds) {
  try {
    const response = await fetch(`${API_BASE_URL}/request-invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_company: customerInfo.company,
        customer_phone: customerInfo.phone,
        product_ids: productIds,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Request invoice error:", error);
    throw error;
  }
}

// ============ Admin User Management API ============

async function fetchUsers() {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch users error:", error);
    throw error;
  }
}

async function createUser(userData) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "POST",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Create user error:", error);
    throw error;
  }
}

async function updateUser(username, userData) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(username)}`, {
      method: "PATCH",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Update user error for ${username}:`, error);
    throw error;
  }
}

async function deleteUser(username) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(username)}`, {
      method: "DELETE",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Delete user error for ${username}:`, error);
    throw error;
  }
}

async function fetchAuditLogs(limit = 100, offset = 0) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/admin/audit-logs?limit=${limit}&offset=${offset}`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch audit logs error:", error);
    throw error;
  }
}

async function fetchCompanySettings() {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/admin/company-settings`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch company settings error:", error);
    throw error;
  }
}

async function updateCompanySettings(settings) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/admin/company-settings`, {
      method: "PATCH",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Update company settings error:", error);
    throw error;
  }
}

async function fetchCurrentUser() {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/user/me`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch current user error:", error);
    throw error;
  }
}

export {
  login,
  fetchProducts,
  fetchPublicProducts,
  fetchProductFilters,
  fetchProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  markOutOfStock,
  searchProducts,
  uploadProducts,
  requestInvoice,
  checkDuplicate,
  // Admin functions
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchAuditLogs,
  fetchCompanySettings,
  updateCompanySettings,
  fetchCurrentUser,
};