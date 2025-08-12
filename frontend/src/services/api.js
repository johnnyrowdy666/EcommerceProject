import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.102:5000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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
      }
    } catch (error) {
      console.error("Error retrieving token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        // Preserve imageUri when clearing auth state
        const userString = await AsyncStorage.getItem("user");
        const imageUri = userString ? (JSON.parse(userString).imageUri || null) : null;
        await AsyncStorage.setItem("user", JSON.stringify({ imageUri }));
        await AsyncStorage.removeItem("token");
      } catch (err) {
        console.error("Error clearing auth state:", err);
      }
    }
    return Promise.reject(error);
  }
);

const handleApiError = (error) => {
  console.error("API Error:", {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status,
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
    const response = await apiClient.post("/login", {
      username: username.trim(),
      password,
    });

    if (response.data.token) {
      await AsyncStorage.setItem("token", response.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

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

// ==================== ORDER APIs ====================

export const createOrder = async (
  productId,
  quantity,
  shippingAddress = "Default Address",
  paymentMethod = "cash"
) => {
  try {
    if (!productId || !quantity) {
      throw new Error("Product ID and quantity are required");
    }
    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const response = await apiClient.post("/orders", {
      product_id: productId,
      quantity: parseInt(quantity),
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getMyOrders = async () => {
  try {
    const response = await apiClient.get("/orders");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    if (!orderId || !status) {
      throw new Error("Order ID and status are required");
    }

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error(`Status must be one of: ${validStatuses.join(", ")}`);
    }

    const response = await apiClient.put(`/orders/${orderId}/status`, {
      status,
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const processPayment = async (totalAmount) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const paymentId = `PAY_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    return {
      success: true,
      paymentId,
      amount: totalAmount,
      status: "completed",
      timestamp: new Date().toISOString(),
    };
  } catch {
    throw new Error("Payment processing failed");
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

// ==================== ADMIN APIs ====================

export const getAdminUsers = async () => {
  try {
    const response = await apiClient.get("/admin/users");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getAdminOrders = async () => {
  try {
    const response = await apiClient.get("/admin/orders");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    if (!userId || !role) {
      throw new Error("User ID and role are required");
    }
    if (!["user", "admin"].includes(role)) {
      throw new Error("Role must be either 'user' or 'admin'");
    }

    const response = await apiClient.put(`/admin/users/${userId}/role`, {
      role,
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
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

export default {
  registerUser,
  loginUser,
  logoutUser,
  isUserLoggedIn,
  getStoredUser,
  getProducts,
  getProductById,
  uploadProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  getProductsByPriceRange,
  getCategories,
  createCategory,
  createOrder,
  getMyOrders,
  updateOrderStatus,
  processPayment,
  getCurrentUser,
  updateUserProfile,
  updateUserImage,
  getAdminUsers,
  getAdminOrders,
  updateUserRole,
  checkNetworkConnectivity,
  getApiBaseUrl,
  setApiBaseUrl,
};
