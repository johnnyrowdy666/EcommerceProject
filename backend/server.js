// backend/server.js
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 
  "your-62f7b53e9d7efdeabce4c2ad879a452d9ad9ecbbac872203ae472e613bbcd7081fd90d5dbc75bf664a34808227755d4427935b8ceca21f21e05396d5c98b4187c0c76264a4a5a443227c9f40a12680204185fe6f81302662db47b3a69f75e85c28adb2125097c67a81b8db63e67b269bed408feaccc6f8f27248f929ba26b3d49262e96c856a6d82d6a9ff962d2e7418728e9b4bb83a4f47900cae66dc7c7b7f3a9d5de24c6937c9c51767099ddba6dcbbf5d78b82b1f3ede0891e36a557cdfe4944c5761baf3f14e15527470cd9c8180b56ec1ebc127a6c4856dc5fdf8cb489e80a06ecd9cd0242d8ca9250cf366806d17a04cd3bcd3a612042af0190f5fe1b-key";

const UPLOAD_PATH = process.env.UPLOAD_PATH || "uploads/";

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, UPLOAD_PATH)));

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_PATH),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ========== AUTH MIDDLEWARE ==========

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// Middleware to check admin role
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ========== AUTH ENDPOINTS ==========

// Register new user
app.post("/api/register", async (req, res) => {
  const { username, password, email, phone } = req.body;
  if (!username || !password || !email) {
    return res
      .status(400)
      .json({ error: "username, password, email required" });
  }
  try {
    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (user) return res.status(409).json({ error: "Username taken" });

        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
          "INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)",
          [username, hashedPassword, email, phone || null],
          function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "User registered", userId: this.lastID });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "username and password required" });

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          image_uri: user.image_uri,
        },
      });
    }
  );
});

// Get current user
app.get("/api/users/me", authenticateToken, (req, res) => {
  db.get(
    "SELECT id, username, email, phone, role, image_uri FROM users WHERE id = ?",
    [req.user.userId],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    }
  );
});

// Update user profile
app.put("/api/users/me", authenticateToken, upload.single("image"), (req, res) => {
  const userId = req.user.userId;
  const { username, email, phone } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  // Build dynamic update query
  const updates = [];
  const values = [];
  
  if (username) {
    updates.push("username = ?");
    values.push(username);
  }
  if (email) {
    updates.push("email = ?");
    values.push(email);
  }
  if (phone) {
    updates.push("phone = ?");
    values.push(phone);
  }
  if (image) {
    updates.push("image_uri = ?");
    values.push(image);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  values.push(userId);

  db.run(
    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
    values,
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Return updated user data
      db.get(
        "SELECT id, username, email, phone, role, image_uri FROM users WHERE id = ?",
        [userId],
        (err, updatedUser) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(updatedUser);
        }
      );
    }
  );
});

// ========== CATEGORIES ==========

app.get("/api/categories", (req, res) => {
  db.all("SELECT id, name, image_uri FROM categories", [], (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to fetch categories" });
    }
    res.json(rows || []);
  });
});

app.post(
  "/api/categories",
  authenticateToken,
  upload.single("image"),
  (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Category name required" });
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    db.run(
      "INSERT INTO categories (name, image_uri) VALUES (?, ?)",
      [name, image],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          message: "Category created",
          category: {
            id: this.lastID,
            name,
            image_uri: image,
          },
        });
      }
    );
  }
);

// ========== PRODUCTS ==========

// Get all products with optional filters
app.get("/api/products", (req, res) => {
  const { search, category, minPrice, maxPrice } = req.query;
  let query = "SELECT * FROM products WHERE 1=1";
  const params = [];

  if (search) {
    query += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  if (minPrice) {
    query += " AND price >= ?";
    params.push(minPrice);
  }
  if (maxPrice) {
    query += " AND price <= ?";
    params.push(maxPrice);
  }

  query += " ORDER BY id DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get product by id
app.get("/api/products/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Product not found" });
    res.json(row);
  });
});

// Create product
app.post(
  "/api/products",
  authenticateToken,
  upload.single("image"),
      (req, res) => {
      const { title, description, price, category, size, color, stock } = req.body;
      const image = req.file ? `/uploads/${req.file.filename}` : null;
      const userId = req.user.userId;
    
    if (!title || !description || !price || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    db.run(
      "INSERT INTO products (title, description, price, category, size, color, stock, image_uri, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        description,
        price,
        category,
        size || null,
        color || null,
        stock || 0,
        image,
        userId,
      ],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product created", productId: this.lastID });
      }
    );
  }
);

// Update product
app.put(
  "/api/products/:id",
  authenticateToken,
  upload.single("image"),
      (req, res) => {
      const productId = req.params.id;
      const { title, description, price, category, size, color, stock } = req.body;
      const image = req.file ? `/uploads/${req.file.filename}` : null;
      const userId = req.user.userId;

    // Check if user owns the product or is admin
    db.get(
      "SELECT user_id FROM products WHERE id = ?",
      [productId],
      (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ error: "Product not found" });
        
        if (product.user_id !== userId && req.user.role !== 'admin') {
          return res.status(403).json({ error: "Not authorized to update this product" });
        }

        // Build dynamic update query
        const updates = [];
        const values = [];
        
        if (title) {
          updates.push("title = ?");
          values.push(title);
        }
        if (description) {
          updates.push("description = ?");
          values.push(description);
        }
        if (price) {
          updates.push("price = ?");
          values.push(price);
        }
        if (category) {
          updates.push("category = ?");
          values.push(category);
        }
        if (size !== undefined) {
          updates.push("size = ?");
          values.push(size);
        }
        if (color !== undefined) {
          updates.push("color = ?");
          values.push(color);
        }
        if (stock !== undefined) {
          updates.push("stock = ?");
          values.push(stock);
        }
        if (image) {
          updates.push("image_uri = ?");
          values.push(image);
        }

        if (updates.length === 0) {
          return res.status(400).json({ error: "No fields to update" });
        }

        values.push(productId);

        db.run(
          `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
          values,
          function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Product updated", productId });
          }
        );
      }
    );
  }
);

// Delete product
app.delete("/api/products/:id", authenticateToken, (req, res) => {
  const productId = req.params.id;
  const userId = req.user.userId;

  // Check if user owns the product or is admin
  db.get(
    "SELECT user_id FROM products WHERE id = ?",
    [productId],
    (err, product) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!product) return res.status(404).json({ error: "Product not found" });
      
      if (product.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to delete this product" });
      }

      db.run("DELETE FROM products WHERE id = ?", [productId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product deleted", productId });
      });
    }
  );
});

// ========== ORDERS ==========

// Create order
app.post("/api/orders", authenticateToken, (req, res) => {
  const { product_id, quantity, shipping_address, payment_method } = req.body;
  const user_id = req.user.userId;

  if (!product_id || !quantity) {
    return res.status(400).json({ error: "Product ID and quantity are required" });
  }

  // Check if product exists and has enough stock
  db.get(
    "SELECT * FROM products WHERE id = ?",
    [product_id],
    (err, product) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!product) return res.status(404).json({ error: "Product not found" });
      
      if (product.stock < quantity) {
        return res.status(400).json({ error: "Insufficient stock" });
      }

      db.run(
        "INSERT INTO orders (user_id, product_id, quantity, shipping_address, payment_method, status) VALUES (?, ?, ?, ?, ?, ?)",
        [user_id, product_id, quantity, shipping_address || "Default Address", payment_method || "cash", "pending"],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          
          // Update product stock
          db.run(
            "UPDATE products SET stock = stock - ? WHERE id = ?",
            [quantity, product_id],
            (err) => {
              if (err) console.error("Failed to update stock:", err);
            }
          );

          res.json({ message: "Order created", orderId: this.lastID });
        }
      );
    }
  );
});

// Get user's orders
app.get("/api/orders", authenticateToken, (req, res) => {
  db.all(
    `SELECT o.*, p.title as product_title, p.price, p.image_uri as product_image, 
            u.username as seller_name
     FROM orders o 
     JOIN products p ON o.product_id = p.id 
     LEFT JOIN users u ON p.user_id = u.id
     WHERE o.user_id = ? 
     ORDER BY o.created_at DESC`,
    [req.user.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Update order status
app.put("/api/orders/:id/status", authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const userId = req.user.userId;

  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
  }

  // Check if user owns the order or is admin
  db.get(
    "SELECT user_id FROM orders WHERE id = ?",
    [orderId],
    (err, order) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!order) return res.status(404).json({ error: "Order not found" });
      
      if (order.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to update this order" });
      }

      db.run(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, orderId],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "Order status updated", orderId, status });
        }
      );
    }
  );
});

// ========== ADMIN ENDPOINTS ==========

// Get all users (admin only)
app.get("/api/admin/users", authenticateToken, requireAdmin, (req, res) => {
  db.all(
    "SELECT id, username, email, phone, role, image_uri FROM users ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Get all orders (admin only)
app.get("/api/admin/orders", authenticateToken, requireAdmin, (req, res) => {
  db.all(
    `SELECT o.*, p.title as product_title, p.price, p.image_uri as product_image,
            buyer.username as buyer_name, seller.username as seller_name
     FROM orders o 
     JOIN products p ON o.product_id = p.id 
     JOIN users buyer ON o.user_id = buyer.id
     LEFT JOIN users seller ON p.user_id = seller.id
     ORDER BY o.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Update user role (admin only)
app.put("/api/admin/users/:id/role", authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ error: "Role must be either 'user' or 'admin'" });
  }

  db.run(
    "UPDATE users SET role = ? WHERE id = ?",
    [role, userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User role updated", userId, role });
    }
  );
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
