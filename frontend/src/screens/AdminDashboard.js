import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { getAdminUsers, getAdminOrders } from "../services/api";
import Icon from "react-native-vector-icons/Ionicons";

const AdminDashboard = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === "users") {
          const data = await getAdminUsers();
          setUsers(data);
        } else {
          const data = await getAdminOrders();
          setOrders(data);
        }
      } catch (error) {
        console.error("Admin data fetch error:", error);
      }
    };
    fetchData();
  }, [activeTab]);

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

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "users" && styles.activeTab]}
          onPress={() => setActiveTab("users")}
        >
          <Text style={styles.tabText}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "orders" && styles.activeTab]}
          onPress={() => setActiveTab("orders")}
        >
          <Text style={styles.tabText}>Orders</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "users" ? (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
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
  tabContainer: {
    flexDirection: "row",
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
  },
  listContainer: {
    padding: 15,
  },
  item: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  itemTitle: {
    fontWeight: "bold",
    marginBottom: 5,
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
  },
  statusText: {
    marginTop: 5,
    color: "#666",
  },
});

export default AdminDashboard;
