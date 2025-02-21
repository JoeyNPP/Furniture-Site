// Path: frontend/src/api.js

// 1) Fetch all products
export async function fetchProducts() {
  try {
    const response = await fetch("http://127.0.0.1:8000/products/");
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }
    // Django might return { products: [...] } or just an array
    return await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

// 2) Create a new product
export async function createProduct(data) {
  try {
    const response = await fetch("http://127.0.0.1:8000/products/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

// 3) Update an existing product
// If your Django route is /products/<id>/, note the trailing slash:
export async function updateProduct(id, data) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/products/${id}/`, {
      method: "PATCH", // Use PATCH to match the backend update endpoint
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

// Delete a product
export async function deleteProduct(id) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/products/${id}/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

// Mark product as out-of-stock
export async function markOutOfStock(id) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/products/${id}/mark-out-of-stock/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error marking product out-of-stock:", error);
    throw error;
  }
}

// 4) Send single-product email & update last_sent in one step
// (If you created a "send_product_email" endpoint in Django)
export async function sendProductEmail(id) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/products/${id}/send-email/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error sending product email:", error);
    throw error;
  }
}

// 5) Send group email for multiple products
// (If you created a "send_group_email" endpoint in Django)
export async function sendGroupEmail(productIds) {
  try {
    const response = await fetch("http://127.0.0.1:8000/products/send-group-email/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_ids: productIds }),
    });
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error sending group email:", error);
    throw error;
  }
}
