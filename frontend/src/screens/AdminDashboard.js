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
import { getAdminUsers, getAdminOrders } from "../services/api";
import Icon from "react-native-vector-icons/Ionicons";
import { useUser } from "../component/UserContext";
import { useNavigation } from "@react-navigation/native";

const AdminDashboard = ({ navigation }) => {
  const { isAuthenticated, hasRole, role } = useUser();
  const nav = useNavigation();

  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
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
        if (activeTab === "users") {
          const data = await getAdminUsers();
          setUsers(data);
        } else {
          const data = await getAdminOrders();
          setOrders(data);
        }
      } catch (error) {
        console.error("Admin data fetch error:", error);
        Alert.alert("Error", "Failed to load admin data: " + error.message);
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
      </View>

      {activeTab === "users" ? (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
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
});

export default AdminDashboard;
