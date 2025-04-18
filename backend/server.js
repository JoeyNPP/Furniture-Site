const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: 'postgres', // Using postgres user
  host: 'localhost',
  database: 'npp_deals',
  password: '26,Sheetpans!', // Leave blank or set your postgres password if configured
  port: 5432,
});

const JWT_SECRET = 'your_jwt_secret'; // Replace with a strong secret
const TOKEN_EXPIRY = '1h'; // Token expires in 1 hour

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Refresh token endpoint
app.post('/refresh-token', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const newToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error during login' });
  }
});

// Product CRUD operations
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json({ products: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  const {
    title, category, vendor_id, vendor, price, cost, moq, qty, upc, asin,
    lead_time, exp_date, fob, image_url, out_of_stock, amazon_url, walmart_url,
    ebay_url, offer_date, last_sent
  } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (title, category, vendor_id, vendor, price, cost, moq, qty, upc, asin, lead_time, exp_date, fob, image_url, out_of_stock, amazon_url, walmart_url, ebay_url, offer_date, last_sent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *',
      [title, category, vendor_id, vendor, price, cost, moq, qty, upc, asin, lead_time, exp_date, fob, image_url, out_of_stock, amazon_url, walmart_url, ebay_url, offer_date, last_sent]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product' });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    title, category, vendor_id, vendor, price, cost, moq, qty, upc, asin,
    lead_time, exp_date, fob, image_url, out_of_stock, amazon_url, walmart_url,
    ebay_url, offer_date, last_sent
  } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET title = $1, category = $2, vendor_id = $3, vendor = $4, price = $5, cost = $6, moq = $7, qty = $8, upc = $9, asin = $10, lead_time = $11, exp_date = $12, fob = $13, image_url = $14, out_of_stock = $15, amazon_url = $16, walmart_url = $17, ebay_url = $18, offer_date = $19, last_sent = $20 WHERE id = $21 RETURNING *',
      [title, category, vendor_id, vendor, price, cost, moq, qty, upc, asin, lead_time, exp_date, fob, image_url, out_of_stock, amazon_url, walmart_url, ebay_url, offer_date, last_sent, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product' });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
});

app.put('/api/products/:id/out-of-stock', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE products SET out_of_stock = TRUE WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error marking product out of stock' });
  }
});

app.get('/api/products/search', authenticateToken, async (req, res) => {
  const { query } = req.query;
  try {
    const result = await pool.query('SELECT * FROM products WHERE title ILIKE $1 OR category ILIKE $1', [`%${query}%`]);
    res.json({ products: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Error searching products' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
