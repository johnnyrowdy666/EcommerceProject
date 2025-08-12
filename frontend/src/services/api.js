import axios from "axios";

// ตรวจสอบ environment อย่างถูกต้อง
let AsyncStorage;
if (typeof window !== 'undefined' && window.localStorage) {
  // Web environment - ใช้ localStorage
  AsyncStorage = {
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
  };
} else {
  // React Native environment - ใช้ AsyncStorage
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
}

const API_URL = "http://192.168.0.102:5000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔑 Token added to request:", config.url);
      } else {
        console.log("⚠️ No token found for request:", config.url);
      }
    } catch (error) {
      console.error("❌ Error retrieving token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      try {
        // Preserve imageUri when clearing auth state
        const userString = await AsyncStorage.getItem("user");
        const imageUri = userString ? (JSON.parse(userString).imageUri || null) : null;
        await AsyncStorage.setItem("user", JSON.stringify({ imageUri }));
        await AsyncStorage.removeItem("token");
        console.log("🔄 Cleared auth state due to 401");
      } catch (err) {
        console.error("Error clearing auth state:", err);
      }
    }
    return Promise.reject(error);
  }
);

const handleApiError = (error) => {
  console.error("API Error Details:", {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status,
    url: error.config?.url,
  });
  
  const errorMessage =
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    "An unexpected error occurred";
  throw new Error(errorMessage);
};

// ==================== AUTHENTICATION APIs ====================

export const registerUser = async (username, password, email, phone) => {
  try {
    const response = await apiClient.post("/register", {
      username: username.trim(),
      password,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const loginUser = async (username, password) => {
  try {
    console.log("🔐 Attempting login for user:", username);
    const response = await apiClient.post("/login", {
      username: username.trim(),
      password,
    });

    if (response.data.token) {
      await AsyncStorage.setItem("token", response.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
      console.log("✅ Login successful, stored token and user data");
    }

    return response.data;
  } catch (error) {
    console.error("❌ Login failed:", error);
    handleApiError(error);
  }
};

// ... (ส่วนที่เหลือของไฟล์เหมือนเดิม) ...

export const logoutUser = async () => {
  try {
    const userData = await AsyncStorage.getItem("user");
    let imageUri = null;
    if (userData) {
      const parsed = JSON.parse(userData);
      imageUri = parsed.imageUri || null;
    }
    // เก็บ imageUri ไว้ แต่ลบ token และข้อมูลอื่น ๆ
    await AsyncStorage.setItem("user", JSON.stringify({ imageUri }));
    await AsyncStorage.removeItem("token");
    console.log("🔓 Logged out successfully");
  } catch (error) {
    console.error("Error during logout:", error);
  }
};

export const isUserLoggedIn = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    return !!token;
  } catch {
    return false;
  }
};

export const getStoredUser = async () => {
  try {
    const userString = await AsyncStorage.getItem("user");
    return userString ? JSON.parse(userString) : null;
  } catch {
    return null;
  }
};

// ==================== PRODUCT APIs ====================

export const getProducts = async (filters = {}) => {
  try {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([_, value]) => value !== undefined && value !== null && value !== ""
      )
    );
    const response = await apiClient.get("/products", {
      params: cleanFilters,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getProductById = async (productId) => {
  try {
    if (!productId) throw new Error("Product ID is required");
    const response = await apiClient.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Create a new product with proper error handling and FormData setup
 */
export const uploadProduct = async (productData) => {
  try {
    console.log("Starting product upload with data:", productData);

    const requiredFields = [
      "title",
      "description",
      "price",
      "category",
      "imageUri",
    ];
    const missingFields = [];

    for (const field of requiredFields) {
      if (!productData[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    if (isNaN(productData.price) || productData.price <= 0) {
      throw new Error("Price must be a positive number");
    }

    const formData = new FormData();

    formData.append("title", productData.title.trim());
    formData.append("description", productData.description.trim());
    formData.append("price", productData.price.toString());
    formData.append("category", productData.category.trim());

    if (productData.size && productData.size.trim()) {
      formData.append("size", productData.size.trim());
    }
    if (productData.color && productData.color.trim()) {
      formData.append("color", productData.color.trim());
    }
    if (productData.stock && productData.stock > 0) {
      formData.append("stock", productData.stock.toString());
    }

    if (productData.imageUri) {
      const uriParts = productData.imageUri.split(".");
      const fileType = uriParts[uriParts.length - 1].toLowerCase();

      if (!["jpg", "jpeg", "png"].includes(fileType)) {
        throw new Error("Image must be JPG, JPEG, or PNG format");
      }

      const imageFile = {
        uri: productData.imageUri,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
        name: `product_${Date.now()}.${fileType}`,
      };

      formData.append("image", imageFile);
      console.log("Image file prepared:", imageFile);
    }

    console.log("Making API request to upload product...");

    const response = await apiClient.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000,
    });

    console.log("Product upload successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Product upload error:", error);

    if (error.response) {
      const errorMessage =
        error.response.data?.error ||
        error.response.data?.message ||
        `Server error: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error("Network error: Please check your internet connection");
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Upload timeout: Please try again with a smaller image");
    } else {
      throw new Error(error.message || "Failed to upload product");
    }
  }
};

export const updateProduct = async (productId, updateData) => {
  try {
    if (!productId) throw new Error("Product ID is required");

    const formData = new FormData();
    const fields = [
      "title",
      "description",
      "price",
      "category",
      "size",
      "color",
      "stock",
    ];
    fields.forEach((field) => {
      if (updateData[field] !== undefined && updateData[field] !== null) {
        if (field === "price" || field === "stock") {
          formData.append(field, updateData[field].toString());
        } else {
          formData.append(field, updateData[field].toString().trim());
        }
      }
    });

    if (updateData.imageUri) {
      const uriParts = updateData.imageUri.split(".");
      const fileType = uriParts[uriParts.length - 1].toLowerCase();
      const imageFile = {
        uri: updateData.imageUri,
        name: `product_${Date.now()}.${fileType}`,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
      };
      formData.append("image", imageFile);
    }

    const response = await apiClient.put(`/products/${productId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteProduct = async (productId) => {
  try {
    if (!productId) throw new Error("Product ID is required");
    const response = await apiClient.delete(`/products/${productId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ==================== CATEGORY APIs ====================

export const getCategories = async () => {
  try {
    const response = await apiClient.get("/categories");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createCategory = async (name, imageUri = null) => {
  try {
    if (!name) throw new Error("Category name is required");
    const formData = new FormData();
    formData.append("name", name.trim());

    if (imageUri) {
      const uriParts = imageUri.split(".");
      const fileType = uriParts[uriParts.length - 1].toLowerCase();
      const imageFile = {
        uri: imageUri,
        name: `category_${Date.now()}.${fileType}`,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
      };
      formData.append("image", imageFile);
    }

    const response = await apiClient.post("/categories", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ========== CART & ORDERS ==========

export const createOrder = async (productId, quantity) => {
  try {
    const response = await apiClient.post("/orders", {
      product_id: productId,
      quantity: quantity,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error(error.response?.data?.error || "Failed to create order");
  }
};

export const processPayment = async (amount) => {
  try {
    const response = await apiClient.post("/payments", {
      amount: amount,
      currency: "THB",
    });
    return response.data;
  } catch (error) {
    console.error("Error processing payment:", error);
    // For now, return a mock successful payment
    return {
      success: true,
      paymentId: `PAY-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      amount: amount,
    };
  }
};

export const getOrders = async () => {
  try {
    const response = await apiClient.get("/orders");
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch orders");
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await apiClient.put(`/orders/${orderId}/status`, {
      status: status,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error(error.response?.data?.error || "Failed to update order status");
  }
};

// ==================== USER PROFILE APIs ====================

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get("/users/me");
    await AsyncStorage.setItem("user", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const formData = new FormData();
    if (userData.username)
      formData.append("username", userData.username.trim());
    if (userData.email)
      formData.append("email", userData.email.trim().toLowerCase());
    if (userData.phone) formData.append("phone", userData.phone.trim());

    if (userData.imageUri) {
      const uriParts = userData.imageUri.split(".");
      const fileType = uriParts[uriParts.length - 1].toLowerCase();
      const imageFile = {
        uri: userData.imageUri,
        name: `profile_${Date.now()}.${fileType}`,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
      };
      formData.append("image", imageFile);
    }

    const response = await apiClient.put("/users/me", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // เก็บข้อมูลผู้ใช้พร้อม URL รูปลง AsyncStorage
    await AsyncStorage.setItem(
      "user",
      JSON.stringify({
        ...response.data,
        imageUri: response.data.image_uri, // ให้ backend ส่ง URL รูป
      })
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateUserImage = async (username, imageUri) => {
  try {
    return await updateUserProfile({ imageUri });
  } catch (error) {
    handleApiError(error);
  }
};

// ========== ADMIN FUNCTIONS (✅ แก้ไขแล้ว) ==========

export const getAdminUsers = async () => {
  try {
    console.log("📊 Fetching admin users...");
    const response = await apiClient.get("/admin/users");
    console.log("✅ Admin users fetched:", response.data?.length || 0, "users");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching admin users:", error);
    
    // More detailed error logging
    if (error.response) {
      console.error("Response error:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    throw new Error(error.response?.data?.error || "Failed to fetch users");
  }
};

export const getAdminProducts = async () => {
  try {
    console.log("📦 Fetching admin products...");
    const response = await apiClient.get("/admin/products");
    console.log("✅ Admin products fetched:", response.data?.length || 0, "products");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching admin products:", error);
    
    if (error.response) {
      console.error("Response error:", {
        status: error.response.status,
        data: error.response.data,
      });
    }
    
    throw new Error(error.response?.data?.error || "Failed to fetch products");
  }
};

export const getAdminOrders = async () => {
  try {
    console.log("📋 Fetching admin orders...");
    const response = await apiClient.get("/admin/orders");
    console.log("✅ Admin orders fetched:", response.data?.length || 0, "orders");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching admin orders:", error);
    
    if (error.response) {
      console.error("Response error:", {
        status: error.response.status,
        data: error.response.data,
      });
    }
    
    throw new Error(error.response?.data?.error || "Failed to fetch orders");
  }
};

export const updateUserRole = async (userId, newRole) => {
  try {
    console.log("🔄 Updating user role:", { userId, newRole });
    const response = await apiClient.put(`/admin/users/${userId}/role`, {
      role: newRole,
    });
    console.log("✅ User role updated successfully");
    return response.data;
  } catch (error) {
    console.error("❌ Error updating user role:", error);
    throw new Error(error.response?.data?.error || "Failed to update user role");
  }
};

// ✅ เพิ่ม Admin Stats API
export const getAdminStats = async () => {
  try {
    console.log("📈 Fetching admin stats...");
    
    // Fetch all data for stats calculation
    const [users, orders, products] = await Promise.all([
      getAdminUsers(),
      getAdminOrders(),
      getAdminProducts()
    ]);

    const stats = {
      totalUsers: users.length,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total_price || 0), 0),
      pendingOrders: orders.filter(order => order.status === 'pending').length,
      adminUsers: users.filter(user => user.role === 'admin').length,
      outOfStockProducts: products.filter(product => product.stock <= 0).length,
    };

    console.log("✅ Admin stats calculated:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Error fetching admin stats:", error);
    throw new Error("Failed to fetch admin statistics");
  }
};

// ==================== UTILITY FUNCTIONS ====================

export const checkNetworkConnectivity = async () => {
  try {
    const response = await apiClient.get("/health", { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
};

export const getApiBaseUrl = () => apiClient.defaults.baseURL;

export const setApiBaseUrl = (newUrl) => {
  apiClient.defaults.baseURL = newUrl;
};

export const searchProducts = async (searchTerm) => {
  try {
    return await getProducts({ search: searchTerm });
  } catch (error) {
    handleApiError(error);
  }
};

export const getProductsByCategory = async (category) => {
  try {
    return await getProducts({ category });
  } catch (error) {
    handleApiError(error);
  }
};

export const getProductsByPriceRange = async (minPrice, maxPrice) => {
  try {
    return await getProducts({ minPrice, maxPrice });
  } catch (error) {
    handleApiError(error);
  }
};

// ✅ เพิ่ม Debug Helper
export const testAdminAPI = async () => {
  try {
    console.log("🧪 Testing admin API endpoints...");
    const token = await AsyncStorage.getItem("token");
    console.log("Token:", token ? "✅ Found" : "❌ Missing");
    
    const user = await AsyncStorage.getItem("user");
    const userData = user ? JSON.parse(user) : null;
    console.log("User data:", userData);
    
    // Test each endpoint
    const tests = [
      { name: "Users", fn: getAdminUsers },
      { name: "Orders", fn: getAdminOrders },
      { name: "Products", fn: getAdminProducts },
    ];
    
    for (const test of tests) {
      try {
        const result = await test.fn();
        console.log(`✅ ${test.name}: ${result?.length || 0} items`);
      } catch (error) {
        console.error(`❌ ${test.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};