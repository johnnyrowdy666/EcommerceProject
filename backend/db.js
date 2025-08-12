// backend/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "database.sqlite3");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to connect to database", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

// สร้างตาราง
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'user',
      image_uri TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ✅ แก้ไข products table ให้มี user_id และ created_at ตั้งแต่ต้น
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      size TEXT,
      color TEXT,
      stock INTEGER DEFAULT 0,
      image_uri TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      image_uri TEXT
    )
  `);

  // Create orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `, (err) => {
    if (err) {
      console.error("Error creating orders table:", err);
    } else {
      console.log("Orders table ready");
    }
  });

  // Create payments table (for future payment tracking)
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'THB',
      status TEXT DEFAULT 'pending',
      payment_method TEXT DEFAULT 'cash',
      transaction_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders (id)
    )
  `, (err) => {
    if (err) {
      console.error("Error creating payments table:", err);
    } else {
      console.log("Payments table ready");
    }
  });

  // ✅ เพิ่ม columns สำหรับตารางเก่าที่อาจไม่มี (กรณีที่ database มีอยู่แล้ว)
  
  // Add user_id column to existing products if it doesn't exist
  db.run(`
    ALTER TABLE products ADD COLUMN user_id INTEGER
  `, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Error adding user_id column to products:", err);
    } else {
      console.log("✅ user_id column ready in products table");
    }
  });

  // Add created_at column to existing products if it doesn't exist
  db.run(`
    ALTER TABLE products ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  `, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Error adding created_at column to products:", err);
    } else {
      console.log("✅ created_at column ready in products table");
    }
  });

  // Add created_at column to existing users if it doesn't exist
  db.run(`
    ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  `, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Error adding created_at column to users:", err);
    } else {
      console.log("✅ created_at column ready in users table");
    }
  });

  // ✅ อัพเดตข้อมูลเก่าที่ไม่มี created_at
  db.run(`
    UPDATE products SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL
  `, (err) => {
    if (err) {
      console.error("Error updating products created_at:", err);
    }
  });

  db.run(`
    UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL
  `, (err) => {
    if (err) {
      console.error("Error updating users created_at:", err);
    }
  });

  // เพิ่มข้อมูลหมวดหมู่เริ่มต้นหากไม่มี
  db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
    if (err) return console.error("Error checking categories:", err);
    if (row.count === 0) {
      const defaultCategories = [
        "เสื้อ",
        "กางเกง",
        "รองเท้า",
        "เครื่องประดับ",
        "อื่นๆ",
      ];
      defaultCategories.forEach((name, index) => {
        db.run("INSERT INTO categories (name) VALUES (?)", [name], (err) => {
          if (err) console.error("Error inserting default category:", err);
        });
      });
      console.log("Added default categories");
    }
  });
});

module.exports = db;