// backend/server.js
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 
  "62f7b53e9d7efdeabce4c2ad879a452d9ad9ecbbac872203ae472e613bbcd7081fd90d5dbc75bf664a34808227755d4427935b8ceca21f21e05396d5c98b4187c0c76264a4a5a443227c9f40a12680204185fe6f81302662db47b3a69f75e85c28adb2125097c67a81b8db63e67b269bed408feaccc6f8f27248f929ba26b3d49262e96c856a6d82d6a9ff962d2e7418728e9b4bb83a4f47900cae66dc7c7b7f3a9d5de24c6937c9c51767099ddba6dcbbf5d78b82b1f3ede0891e36a557cdfe4944c5761baf3f14e15527470cd9c8180b56ec1ebc127a6c4856dc5fdf8cb489e80a06ecd9cd0242d8ca9250cf366806d17a04cd3bcd3a612042af0190f5fe1b";

const UPLOAD_PATH = process.env.UPLOAD_PATH || "uploads/";

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, UPLOAD_PATH);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadsDir}`);
}

// ✅ Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.0.102:3000', '*'], // รองรับ development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Enhanced middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} - ${req.method} ${req.originalUrl}`);
  
  if (req.headers.authorization) {
    console.log(`🔑 Authorization header present: ${req.headers.authorization.substring(0, 20)}...`);
  } else {
    console.log(`⚠️ No authorization header for: ${req.originalUrl}`);
  }
  
  next();
});

app.use("/uploads", express.static(path.join(__dirname, UPLOAD_PATH)));

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_PATH),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// ========== AUTH MIDDLEWARE ==========

// ✅ Enhanced authentication middleware with better logging
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  console.log(`🔐 Auth check for ${req.originalUrl}:`, {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    tokenStart: token ? token.substring(0, 10) + "..." : "none"
  });

  if (!token) {
    console.log("❌ No token provided");
    return res.status(401).json({ error: "Token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("❌ Token verification failed:", err.message);
      return res.status(403).json({ error: "Invalid token" });
    }
    
    console.log("✅ Token verified for user:", {
      userId: user.userId,
      username: user.username,
      role: user.role
    });
    
    req.user = user;
    next();
  });
}

// ✅ Enhanced admin middleware with better logging
function requireAdmin(req, res, next) {
  console.log(`👑 Admin check for user:`, {
    userId: req.user?.userId,
    username: req.user?.username,
    role: req.user?.role,
    isAdmin: req.user?.role === 'admin'
  });

  if (req.user.role !== 'admin') {
    console.log("❌ Admin access denied");
    return res.status(403).json({ error: "Admin access required" });
  }
  
  console.log("✅ Admin access granted");
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

// ✅ Enhanced Login with better logging
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  
  console.log(`🔐 Login attempt for username: ${username}`);
  
  if (!username || !password)
    return res.status(400).json({ error: "username and password required" });

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) {
        console.error("❌ Database error during login:", err);
        return res.status(500).json({ error: err.message });
      }
      
      if (!user) {
        console.log("❌ User not found:", username);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log(`👤 User found:`, {
        id: user.id,
        username: user.username,
        role: user.role
      });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        console.log("❌ Invalid password for user:", username);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      
      console.log("✅ Login successful:", {
        userId: user.id,
        username: user.username,
        role: user.role
      });
      
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
  const { search, category, minPrice, maxPrice, hideOutOfStock = "true" } = req.query;
  let query = `
    SELECT 
      p.*,
      u.username as seller_username,
      u.email as seller_email,
      u.phone as seller_phone,
      u.image_uri as seller_image
    FROM products p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += " AND (p.title LIKE ? OR p.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    query += " AND p.category = ?";
    params.push(category);
  }
  if (minPrice) {
    query += " AND p.price >= ?";
    params.push(minPrice);
  }
  if (maxPrice) {
    query += " AND p.price <= ?";
    params.push(maxPrice);
  }
  
  // Hide out-of-stock products by default (can be overridden with hideOutOfStock=false)
  if (hideOutOfStock === "true") {
    query += " AND p.stock > 0";
  }

  query += " ORDER BY p.id DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ Enhanced Admin endpoint to get all products
app.get("/api/admin/products", authenticateToken, requireAdmin, (req, res) => {
  console.log("📦 Admin products endpoint called");
  
  const { search, category, minPrice, maxPrice } = req.query;
  let query = `
    SELECT 
      p.*,
      u.username as seller_username,
      u.email as seller_email,
      u.phone as seller_phone,
      u.image_uri as seller_image
    FROM products p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += " AND (p.title LIKE ? OR p.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    query += " AND p.category = ?";
    params.push(category);
  }
  if (minPrice) {
    query += " AND p.price >= ?";
    params.push(minPrice);
  }
  if (maxPrice) {
    query += " AND p.price <= ?";
    params.push(maxPrice);
  }

  query += " ORDER BY p.id DESC";

  console.log("📋 Executing query:", query);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("❌ Database error in admin products:", err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`✅ Admin products fetched: ${rows.length} products`);
    res.json(rows);
  });
});

// Get product by id
app.get("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT 
      p.*,
      u.username as seller_username,
      u.email as seller_email,
      u.phone as seller_phone,
      u.image_uri as seller_image
    FROM products p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `;
  
  db.get(query, [id], (err, row) => {
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

// ========== PAYMENTS ==========

// Mock payment processing endpoint
app.post("/api/payments", authenticateToken, (req, res) => {
  const { amount, currency } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  // Simulate payment processing delay
  setTimeout(() => {
    // Mock successful payment
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    res.json({
      success: true,
      paymentId: paymentId,
      amount: amount,
      currency: currency || "THB",
      status: "completed",
      timestamp: new Date().toISOString(),
    });
  }, 1000);
});

// ========== ORDERS ==========

// Create order (stock is reduced here after payment)
app.post("/api/orders", authenticateToken, (req, res) => {
  const { product_id, quantity } = req.body;
  const userId = req.user.userId;

  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: "Invalid product_id or quantity" });
  }

  // Get product details and check stock
  db.get("SELECT * FROM products WHERE id = ?", [product_id], (err, product) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.stock < quantity) {
      return res.status(400).json({ 
        error: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}` 
      });
    }

    // Create order
    db.run(
      "INSERT INTO orders (user_id, product_id, quantity, total_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userId,
        product_id,
        quantity,
        product.price * quantity,
        "pending",
        new Date().toISOString(),
      ],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const orderId = this.lastID;

        // Reduce stock
        db.run(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [quantity, product_id],
          (err) => {
            if (err) {
              // If stock update fails, rollback order creation
              db.run("DELETE FROM orders WHERE id = ?", [orderId]);
              return res.status(500).json({ error: "Failed to update stock" });
            }

            res.json({
              message: "Order created successfully",
              order: {
                id: orderId,
                user_id: userId,
                product_id: product_id,
                quantity: quantity,
                total_price: product.price * quantity,
                status: "pending",
                created_at: new Date().toISOString(),
              },
            });
          }
        );
      }
    );
  });
});

// Get user orders
app.get("/api/orders", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT 
      o.*,
      p.title as product_title,
      p.price as product_price,
      p.image_uri as product_image,
      u.username as seller_username
    FROM orders o
    JOIN products p ON o.product_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update order status
app.put("/api/orders/:id/status", authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const userId = req.user.userId;

  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  // Check if user owns the order or is admin
  db.get("SELECT * FROM orders WHERE id = ?", [orderId], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Only order owner or admin can update status
    if (order.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    db.run(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, orderId],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Order status updated", status: status });
      }
    );
  });
});

// ========== ✅ ENHANCED ADMIN ENDPOINTS ==========

// ✅ Get all users (admin only) - Enhanced with better logging
app.get("/api/admin/users", authenticateToken, requireAdmin, (req, res) => {
  console.log("👥 Admin users endpoint called");
  
  db.all(
    "SELECT id, username, email, phone, role, image_uri, created_at FROM users ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        console.error("❌ Database error in admin users:", err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`✅ Admin users fetched: ${rows.length} users`);
      console.log("Users roles:", rows.map(u => ({ id: u.id, username: u.username, role: u.role })));
      
      res.json(rows);
    }
  );
});

// ✅ Get all orders (admin only) - Enhanced
app.get("/api/admin/orders", authenticateToken, requireAdmin, (req, res) => {
  console.log("📋 Admin orders endpoint called");
  
  const query = `
    SELECT 
      o.*, 
      p.title as product_title, 
      p.price, 
      p.image_uri as product_image,
      buyer.username as buyer_name, 
      seller.username as seller_name,
      o.created_at,
      o.total_price
    FROM orders o 
    JOIN products p ON o.product_id = p.id 
    JOIN users buyer ON o.user_id = buyer.id
    LEFT JOIN users seller ON p.user_id = seller.id
    ORDER BY o.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Database error in admin orders:", err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`✅ Admin orders fetched: ${rows.length} orders`);
    console.log("Orders sample:", rows.slice(0, 3).map(o => ({ 
      id: o.id, 
      status: o.status, 
      buyer: o.buyer_name,
      total: o.total_price 
    })));
    
    res.json(rows);
  });
});

// ✅ Update user role (admin only) - Enhanced
app.put("/api/admin/users/:id/role", authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  console.log(`🔄 Updating user role:`, { userId, role, requestedBy: req.user.username });

  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ error: "Role must be either 'user' or 'admin'" });
  }

  db.run(
    "UPDATE users SET role = ? WHERE id = ?",
    [role, userId],
    function (err) {
      if (err) {
        console.error("❌ Database error updating role:", err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        console.log("❌ User not found for role update:", userId);
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log("✅ User role updated successfully:", { userId, role });
      res.json({ message: "User role updated", userId, role });
    }
  );
});

// ✅ NEW: Admin Dashboard Stats Endpoint
app.get("/api/admin/stats", authenticateToken, requireAdmin, (req, res) => {
  console.log("📈 Admin stats endpoint called");
  
  const queries = {
    users: "SELECT COUNT(*) as count FROM users",
    orders: "SELECT COUNT(*) as count, SUM(total_price) as revenue FROM orders",
    products: "SELECT COUNT(*) as count FROM products",
    pendingOrders: "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'",
    adminUsers: "SELECT COUNT(*) as count FROM users WHERE role = 'admin'",
    outOfStockProducts: "SELECT COUNT(*) as count FROM products WHERE stock <= 0"
  };

  const stats = {};
  const promises = Object.entries(queries).map(([key, query]) => {
    return new Promise((resolve, reject) => {
      db.get(query, [], (err, row) => {
        if (err) reject(err);
        else {
          stats[key] = row;
          resolve();
        }
      });
    });
  });

  Promise.all(promises)
    .then(() => {
      const result = {
        totalUsers: stats.users.count,
        totalOrders: stats.orders.count,
        totalProducts: stats.products.count,
        totalRevenue: stats.orders.revenue || 0,
        pendingOrders: stats.pendingOrders.count,
        adminUsers: stats.adminUsers.count,
        outOfStockProducts: stats.outOfStockProducts.count,
      };
      
      console.log("✅ Admin stats calculated:", result);
      res.json(result);
    })
    .catch((err) => {
      console.error("❌ Error calculating stats:", err);
      res.status(500).json({ error: "Failed to calculate statistics" });
    });
});

// ✅ Enhanced Health check with admin verification
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    server: "E-commerce API",
    version: "1.0.0"
  });
});

// ✅ Admin health check
app.get("/api/admin/health", authenticateToken, requireAdmin, (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Admin access verified",
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// ✅ 404 handler
app.use("*", (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: "Route not found",
    method: req.method,
    path: req.originalUrl,
    available_routes: [
      "GET /api/health",
      "POST /api/login",
      "POST /api/register",
      "GET /api/admin/users",
      "GET /api/admin/orders",
      "GET /api/admin/products"
    ]
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Global error handler:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API Base URL: http://192.168.0.102:${PORT}/api`);
  console.log(`👑 Admin endpoints: /api/admin/*`);
  console.log(`🏥 Health check: /api/health`);
});