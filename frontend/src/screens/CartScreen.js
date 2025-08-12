import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, Button, Alert } from "react-native";

const MOCK_CART = [
  { id: "1", name: "รองเท้าผ้าใบ", price: 1200 },
  { id: "2", name: "เสื้อยืด", price: 350 },
];

export default function CartScreen() {
  const [cart, setCart] = useState(MOCK_CART);

  const handleCheckout = () => {
    if (cart.length === 0)
      return Alert.alert("ตะกร้าว่าง", "กรุณาเพิ่มสินค้าก่อนชำระเงิน");
    Alert.alert("Checkout", `รวม ${cart.length} รายการ`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 ตะกร้าของฉัน</Text>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>฿{item.price}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>ไม่มีสินค้าในตะกร้า</Text>
        }
      />
      <View style={styles.footer}>
        <Button title="ชำระเงิน" onPress={handleCheckout} color="#ff6f61" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  name: { fontSize: 16 },
  price: { fontSize: 16, fontWeight: "600" },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
  footer: { marginTop: 16 },
});
