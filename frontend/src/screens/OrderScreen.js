import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { getMyOrders } from "../services/api";
import Icon from "react-native-vector-icons/Ionicons";

const OrderScreen = ({ route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orders = await getMyOrders();
        const foundOrder = orders.find((o) => o.id.toString() === orderId);
        setOrder(foundOrder);
      } catch (error) {
        console.error("Error fetching order:", error);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (!order) return <Text>Loading order details...</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id}</Text>
        <Text style={styles.status}>{order.status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product</Text>
        <View style={styles.productInfo}>
          <Image
            source={{ uri: order.product_image }}
            style={styles.productImage}
          />
          <View style={styles.productDetails}>
            <Text style={styles.productTitle}>{order.product_title}</Text>
            <Text>Quantity: {order.quantity}</Text>
            <Text style={styles.price}>${order.total_price.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text>Subtotal</Text>
          <Text>${order.total_price.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Shipping</Text>
          <Text>$5.00</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalText}>
            ${(order.total_price + 5).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Information</Text>
        <Text>Standard Shipping (3-5 business days)</Text>
      </View>

      <View style={styles.trackButton}>
        <Icon name="location-outline" size={20} color="#ff6f61" />
        <Text style={styles.trackText}>Track Order</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "bold",
  },
  status: {
    color: "#ff6f61",
    fontWeight: "bold",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  productInfo: {
    flexDirection: "row",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 15,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  price: {
    color: "#ff6f61",
    fontWeight: "bold",
    marginTop: 5,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
    marginTop: 5,
  },
  totalText: {
    fontWeight: "bold",
  },
  trackButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
  },
  trackText: {
    color: "#ff6f61",
    fontWeight: "bold",
    marginLeft: 10,
  },
});

export default OrderScreen;
