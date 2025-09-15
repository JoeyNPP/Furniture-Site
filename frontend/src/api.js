import { jwtDecode } from 'jwt-decode'; // Updated import for jwt-decode@4.0.0

const API_BASE_URL = process.env.REACT_APP_FRONTEND_URL || 'http://159.65.184.143:8000';
async function login(username, password) {
  try {
    console.log(`Attempting login request for username: ${username}`);
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'username': username,
        'password': password,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Login failed with status ${response.status}: ${errorText}`);
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    console.log(`Login successful for username: ${username}`);
    return data;
  } catch (error) {
    console.error(`Login error for username: ${username}: ${error.message}`);
    throw error;
  }
}
async function fetchProducts() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Fetch products failed: No token found');
      throw new Error('No token found');
    }
    // Decode token if needed (example usage)
    const decodedToken = jwtDecode(token);
    console.log('Attempting to fetch products with decoded token:', decodedToken);
    const response = await fetch(`${API_BASE_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Fetch products failed with status ${response.status}: ${errorText}`);
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    console.log('Products fetched successfully');
    return data;
  } catch (error) {
    console.error(`Fetch products error: ${error.message}`);
    throw error;
  }
}
async function createProduct(data) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Create product failed: No token found');
      throw new Error('No token found');
    }
    console.log('Sending POST with data:', data);
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Create product failed with status ${response.status}: ${errorText}`);
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }
    const result = await response.json();
    console.log('Product created successfully:', result);
    return result;
  } catch (error) {
    console.error(`Create product error: ${error.message}`);
    throw error;
  }
}
async function updateProduct(id, data) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error(`Update product failed for ID ${id}: No token found`);
      throw new Error('No token found');
    }
    console.log(`Preparing PATCH for ID: ${id} with data:`, JSON.stringify(data, null, 2));
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    console.log(`PATCH response status for ID ${id}: ${response.status}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Update product failed for ID ${id} with status ${response.status}: ${errorText}`);
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }
    const result = await response.json();
    console.log(`Product updated successfully for ID ${id}`);
    return result;
  } catch (error) {
    console.error(`Update product error for ID ${id}: ${error.message}`);
    throw error;
  }
}
async function deleteProduct(id) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error(`Delete product failed for ID ${id}: No token found`);
      throw new Error('No token found');
    }
    console.log(`Attempting to delete product with ID: ${id}`);
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Delete product failed for ID ${id} with status ${response.status}: ${errorText}`);
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }
    const result = await response.json();
    console.log(`Product deleted successfully for ID ${id}`);
    return result;
  } catch (error) {
    console.error(`Delete product error for ID ${id}: ${error.message}`);
    throw error;
  }
}
async function markOutOfStock(id) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error(`Mark out-of-stock failed for ID ${id}: No token found`);
      throw new Error('No token found');
    }
    console.log(`Attempting to mark product out-of-stock for ID: ${id}`);
    const response = await fetch(`${API_BASE_URL}/products/${id}/mark-out-of-stock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Mark out-of-stock failed for ID ${id} with status ${response.status}: ${errorText}`);
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }
    const result = await response.json();
    console.log(`Product marked out-of-stock successfully for ID ${id}`);
    return result;
  } catch (error) {
    console.error(`Mark out-of-stock error for ID ${id}: ${error.message}`);
    throw error;
  }
}
async function searchProducts(query) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error(`Search products failed for query '${query}': No token found`);
      throw new Error('No token found');
    }
    console.log(`Attempting to search products with query: ${query}`);
    const response = await fetch(`${API_BASE_URL}/products/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Search products failed for query '${query}' with status ${response.status}: ${errorText}`);
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }
    const result = await response.json();
    console.log(`Products searched successfully for query: ${query}`);
    return result;
  } catch (error) {
    console.error(`Search products error for query '${query}': ${error.message}`);
    throw error;
  }
}
export { login, fetchProducts, createProduct, updateProduct, deleteProduct, markOutOfStock, searchProducts };