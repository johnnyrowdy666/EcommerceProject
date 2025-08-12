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
      image_uri TEXT
    )
  `);

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
      image_uri TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      image_uri TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      shipping_address TEXT,
      payment_method TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

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
