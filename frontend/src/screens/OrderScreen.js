import React, { useState, useEffect } from "react";
import { getOrders } from "../services/api";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useUser } from "../component/UserContext";

const OrderScreen = ({ navigation }) => {
  const { isAuthenticated } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getOrders();
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchOrders(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#ff9800";
      case "processing":
        return "#2196f3";
      case "shipped":
        return "#9c27b0";
      case "delivered":
        return "#4caf50";
      case "cancelled":
        return "#f44336";
      default:
        return "#666";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "รอการยืนยัน";
      case "processing":
        return "กำลังดำเนินการ";
      case "shipped":
        return "จัดส่งแล้ว";
      case "delivered":
        return "จัดส่งสำเร็จ";
      case "cancelled":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>คำสั่งซื้อ #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.product_title}
        </Text>
        <Text style={styles.productPrice}>
          ฿{parseFloat(item.product_price).toLocaleString()}
        </Text>
      </View>

      {/* Seller Information */}
      {item.seller_username && (
        <View style={styles.sellerInfo}>
          <Icon name="person-circle-outline" size={16} color="#666" />
          <Text style={styles.sellerText}>
            Seller: {item.seller_username}
          </Text>
        </View>
      )}

      <View style={styles.orderDetails}>
        <Text style={styles.quantity}>จำนวน: {item.quantity} ชิ้น</Text>
        <Text style={styles.totalPrice}>
          ยอดรวม: ฿{parseFloat(item.total_price).toLocaleString()}
        </Text>
      </View>

      <Text style={styles.orderDate}>
        {new Date(item.created_at).toLocaleDateString("th-TH")}
      </Text>
    </View>
  );

  const renderEmptyOrders = () => (
    <View style={styles.emptyContainer}>
      <Icon name="receipt-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>ไม่มีคำสั่งซื้อ</Text>
      <Text style={styles.emptyText}>
        คุณยังไม่มีคำสั่งซื้อใดๆ
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.shopButtonText}>เลือกซื้อสินค้า</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>คำสั่งซื้อของฉัน</Text>
        </View>
        <View style={styles.guestContainer}>
          <Text style={styles.guestTitle}>กรุณาเข้าสู่ระบบ</Text>
          <Text style={styles.guestText}>เพื่อดูคำสั่งซื้อของคุณ</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>คำสั่งซื้อของฉัน</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6f61" />
          <Text style={styles.loadingText}>กำลังโหลดคำสั่งซื้อ...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>คำสั่งซื้อของฉัน</Text>
        {orders.length > 0 && (
          <Text style={styles.orderCount}>
            {orders.length} คำสั่งซื้อ
          </Text>
        )}
      </View>

      {orders.length === 0 ? (
        renderEmptyOrders()
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.orderList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#ff6f61"]}
              tintColor="#ff6f61"
            />
          }
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  orderCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  orderList: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  productInfo: {
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ff6f61",
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  quantity: {
    fontSize: 14,
    color: "#666",
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  orderDate: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: "#ff6f61",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  shopButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  guestText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: "#ff6f61",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  sellerText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
});

export default OrderScreen;
