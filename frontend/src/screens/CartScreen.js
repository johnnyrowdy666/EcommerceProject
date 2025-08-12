import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useUser } from "../component/UserContext";
import { useCart } from "../component/CartContext";
import { createOrder, processPayment } from "../services/api";
import { getApiBaseUrl } from "../services/api";

const CartScreen = ({ navigation }) => {
  const { isAuthenticated, user } = useUser();
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    getTotalPrice, 
    getTotalItems,
    clearCart 
  } = useCart();
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        "กรุณาเข้าสู่ระบบ",
        "คุณต้องเข้าสู่ระบบก่อนทำการสั่งซื้อ",
        [
          { text: "ยกเลิก", style: "cancel" },
          { text: "เข้าสู่ระบบ", onPress: () => navigation.navigate("Login") },
        ]
      );
      return;
    }

    if (cart.length === 0) {
      Alert.alert("ตะกร้าว่าง", "กรุณาเพิ่มสินค้าก่อนชำระเงิน");
      return;
    }

    // Check stock availability
    const stockErrors = [];
    cart.forEach(item => {
      if (item.quantity > item.stock) {
        stockErrors.push(`${item.title} (เหลือ ${item.stock} ชิ้น)`);
      }
    });

    if (stockErrors.length > 0) {
      Alert.alert(
        "สินค้าไม่เพียงพอ",
        `สินค้าต่อไปนี้มีไม่เพียงพอ:\n${stockErrors.join('\n')}`
      );
      return;
    }

    setCheckoutLoading(true);

    try {
      // Process payment first
      const paymentResult = await processPayment(getTotalPrice());
      
      if (!paymentResult.success) {
        throw new Error("Payment failed");
      }

      // Create orders for each item
      const orderPromises = cart.map(item =>
        createOrder(item.id, item.quantity)
      );

      await Promise.all(orderPromises);

      // Clear cart after successful checkout
      await clearCart();

      Alert.alert(
        "สั่งซื้อสำเร็จ!",
        `หมายเลขการสั่งซื้อ: ${paymentResult.paymentId}\nยอดรวม: ฿${getTotalPrice().toLocaleString()}`,
        [
          {
            text: "ดูคำสั่งซื้อ",
            onPress: () => navigation.navigate("OrderScreen"),
          },
          { text: "ตกลง", onPress: () => navigation.navigate("Home") },
        ]
      );
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert(
        "เกิดข้อผิดพลาด",
        error.message || "ไม่สามารถทำการสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image
        source={
          item.image_uri
            ? item.image_uri.startsWith("/uploads/")
              ? { uri: `${getApiBaseUrl().replace("/api", "")}${item.image_uri}` }
              : { uri: item.image_uri }
            : require("../assets/Logo.jpg")
        }
        style={styles.productImage}
        resizeMode="cover"
      />
      
      <View style={styles.itemDetails}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        {/* Seller Information */}
        {item.seller_username && (
          <View style={styles.sellerContainer}>
            <Icon name="person-circle-outline" size={14} color="#666" />
            <Text style={styles.sellerText} numberOfLines={1}>
              Seller: {item.seller_username}
            </Text>
          </View>
        )}
        
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productPrice}>฿{item.price.toLocaleString()}</Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <Icon name="remove" size={16} color="#666" />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
          >
            <Icon name="add" size={16} color="#666" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.stockInfo}>
          เหลือ {item.stock} ชิ้น
        </Text>
      </View>
      
      <View style={styles.itemActions}>
        <Text style={styles.itemTotal}>
          ฿{(item.price * item.quantity).toLocaleString()}
        </Text>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromCart(item.id)}
        >
          <Icon name="trash-outline" size={20} color="#ff6f61" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Icon name="cart-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>ตะกร้าว่าง</Text>
      <Text style={styles.emptyText}>
        ยังไม่มีสินค้าในตะกร้า
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.shopButtonText}>เลือกซื้อสินค้า</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 ตะกร้าของฉัน</Text>
        {cart.length > 0 && (
          <Text style={styles.itemCount}>
            {getTotalItems()} รายการ
          </Text>
        )}
      </View>

      {cart.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>ยอดรวม:</Text>
              <Text style={styles.totalAmount}>
                ฿{getTotalPrice().toLocaleString()}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.checkoutButton, checkoutLoading && styles.disabledButton]}
              onPress={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.checkoutButtonText}>
                  ชำระเงิน (฿{getTotalPrice().toLocaleString()})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
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
  itemCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  cartList: {
    padding: 16,
  },
  cartItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ff6f61",
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: "center",
  },
  stockInfo: {
    fontSize: 12,
    color: "#999",
  },
  itemActions: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    backgroundColor: "white",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ff6f61",
  },
  checkoutButton: {
    backgroundColor: "#ff6f61",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
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
  sellerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sellerText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
});

export default CartScreen;
