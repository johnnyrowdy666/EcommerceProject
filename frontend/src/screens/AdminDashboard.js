import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { getAdminUsers, getAdminOrders, getAdminProducts } from "../services/api";
import Icon from "react-native-vector-icons/Ionicons";
import { useUser } from "../component/UserContext";
import { useNavigation } from "@react-navigation/native";

const AdminDashboard = ({ navigation }) => {
  const { isAuthenticated, hasRole, role } = useUser();
  const nav = useNavigation();

  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check admin access
  useEffect(() => {
    if (!isAuthenticated || !hasRole("admin")) {
      Alert.alert(
        "Access Denied",
        "You need admin privileges to access this page",
        [
          {
            text: "OK",
            onPress: () => nav.goBack(),
          },
        ]
      );
      return;
    }
  }, [isAuthenticated, hasRole, nav]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !hasRole("admin")) return;

      try {
        setLoading(true);
        console.log("Fetching admin data for tab:", activeTab);
        
        if (activeTab === "users") {
          console.log("Fetching admin users...");
          const data = await getAdminUsers();
          console.log("Admin users data:", data);
          setUsers(data || []);
        } else if (activeTab === "orders") {
          console.log("Fetching admin orders...");
          const data = await getAdminOrders();
          console.log("Admin orders data:", data);
          setOrders(data || []);
        } else if (activeTab === "products") {
          console.log("Fetching admin products...");
          const data = await getAdminProducts();
          console.log("Admin products data:", data);
          setProducts(data || []);
        }
      } catch (error) {
        console.error("Admin data fetch error:", error);
        
        // More detailed error handling
        let errorMessage = "Failed to load admin data";
        if (error.response) {
          if (error.response.status === 401) {
            errorMessage = "Authentication failed. Please login again.";
          } else if (error.response.status === 403) {
            errorMessage = "Access denied. Admin privileges required.";
          } else if (error.response.status === 404) {
            errorMessage = "Admin endpoint not found. Please check server configuration.";
          } else {
            errorMessage = `Server error: ${error.response.status}`;
          }
        } else if (error.request) {
          errorMessage = "Network error. Please check your connection.";
        } else {
          errorMessage = error.message || "Unknown error occurred";
        }
        
        console.error("Error details:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, isAuthenticated, hasRole]);

  // Don't render if not admin
  if (!isAuthenticated || !hasRole("admin")) {
    return (
      <View style={styles.authContainer}>
        <Icon name="shield-outline" size={64} color="#ccc" />
        <Text style={styles.authText}>Admin access required</Text>
        <Text style={styles.authSubText}>
          Current role: {role || "Not authenticated"}
        </Text>
      </View>
    );
  }

  const renderUserItem = ({ item }) => (
    <TouchableOpacity style={styles.item}>
      <Text style={styles.itemTitle}>{item.username}</Text>
      <Text>{item.email}</Text>
      <View
        style={[styles.roleBadge, item.role === "admin" && styles.adminBadge]}
      >
        <Text style={styles.roleText}>{item.role}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("Order", { orderId: item.id })}
    >
      <Text style={styles.itemTitle}>Order #{item.id}</Text>
      <Text>Product: {item.product_title}</Text>
      <Text>Buyer: {item.buyer_name}</Text>
      <Text>Seller: {item.seller_name}</Text>
      <Text style={styles.statusText}>Status: {item.status}</Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => (
    <TouchableOpacity style={styles.item}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text>Category: {item.category}</Text>
      <Text>Price: ฿{item.price}</Text>
      {item.seller_username && (
        <Text style={styles.sellerText}>Seller: {item.seller_username}</Text>
      )}
      <View style={[
        styles.stockBadge, 
        item.stock <= 0 ? styles.outOfStockBadge : 
        item.stock <= 5 ? styles.lowStockBadge : styles.inStockBadge
      ]}>
        <Text style={styles.stockText}>
          Stock: {item.stock} {item.stock <= 0 ? "(Out of Stock)" : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6f61" />
        <Text style={styles.loadingText}>Loading admin data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage users and orders</Text>
        {/* Debug Info */}
        <Text style={styles.debugText}>
          Role: {role || "Unknown"} | Auth: {isAuthenticated ? "Yes" : "No"}
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "users" && styles.activeTab]}
          onPress={() => setActiveTab("users")}
        >
          <Text style={styles.tabText}>Users ({users.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "orders" && styles.activeTab]}
          onPress={() => setActiveTab("orders")}
        >
          <Text style={styles.tabText}>Orders ({orders.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "products" && styles.activeTab]}
          onPress={() => setActiveTab("products")}
        >
          <Text style={styles.tabText}>Products ({products.length})</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "users" ? (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : activeTab === "orders" ? (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  authContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  authText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    fontWeight: "600",
  },
  authSubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tabButton: {
    flex: 1,
    padding: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#ff6f61",
  },
  tabText: {
    fontWeight: "bold",
    color: "#333",
  },
  listContainer: {
    padding: 15,
  },
  item: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 16,
    color: "#333",
  },
  roleBadge: {
    alignSelf: "flex-start",
    padding: 5,
    borderRadius: 4,
    marginTop: 5,
    backgroundColor: "#eee",
  },
  adminBadge: {
    backgroundColor: "#ff6f61",
  },
  roleText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "bold",
  },
  statusText: {
    marginTop: 5,
    color: "#666",
    fontStyle: "italic",
  },
  stockBadge: {
    alignSelf: "flex-start",
    padding: 5,
    borderRadius: 4,
    marginTop: 5,
    backgroundColor: "#eee",
  },
  outOfStockBadge: {
    backgroundColor: "#ff6f61",
  },
  lowStockBadge: {
    backgroundColor: "#ffcc00",
  },
  inStockBadge: {
    backgroundColor: "#4CAF50",
  },
  stockText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "bold",
  },
  sellerText: {
    marginTop: 5,
    color: "#666",
    fontStyle: "italic",
  },
  debugText: {
    marginTop: 10,
    fontSize: 12,
    color: "#555",
  },
});

export default AdminDashboard;
