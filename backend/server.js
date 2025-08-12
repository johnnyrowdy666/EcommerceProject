// backend/server.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET =
  "your-62f7b53e9d7efdeabce4c2ad879a452d9ad9ecbbac872203ae472e613bbcd7081fd90d5dbc75bf664a34808227755d4427935b8ceca21f21e05396d5c98b4187c0c76264a4a5a443227c9f40a12680204185fe6f81302662db47b3a69f75e85c28adb2125097c67a81b8db63e67b269bed408feaccc6f8f27248f929ba26b3d49262e96c856a6d82d6a9ff962d2e7418728e9b4bb83a4f47900cae66dc7c7b7f3a9d5de24c6937c9c51767099ddba6dcbbf5d78b82b1f3ede0891e36a557cdfe4944c5761baf3f14e15527470cd9c8180b56ec1ebc127a6c4856dc5fdf8cb489e80a06ecd9cd0242d8ca9250cf366806d17a04cd3bcd3a612042af0190f5fe1b-key";

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ========== AUTH ==========

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
        { expiresIn: "1h" }
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
        },
      });
    }
  );
});

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

// ========== CATEGORIES ==========

app.get("/api/categories", (req, res) => {
  db.all("SELECT id, name FROM categories", [], (err, rows) => {
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

// Get all products
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
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
    const { title, description, price, category, size, color, stock } =
      req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    if (!title || !description || !price || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    db.run(
      "INSERT INTO products (title, description, price, category, size, color, stock, image_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        description,
        price,
        category,
        size || null,
        color || null,
        stock || 0,
        image,
      ],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product created", productId: this.lastID });
      }
    );
  }
);
// อัปเดตรูปโปรไฟล์ผู้ใช้
app.put(
  "/api/users/me",
  authenticateToken,
  upload.single("image"),
  (req, res) => {
    const userId = req.user.userId; // ดึงจาก token
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!image) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    db.run(
      "UPDATE users SET image_uri = ? WHERE id = ?",
      [image, userId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        // ดึงข้อมูลผู้ใช้ใหม่ส่งกลับ
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
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
