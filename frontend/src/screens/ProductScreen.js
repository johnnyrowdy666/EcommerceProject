import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const products = [
  {
    id: "1",
    name: "Product A",
    price: 199,
    image: "https://via.placeholder.com/150",
    description: "Description of Product A",
  },
  {
    id: "2",
    name: "Product B",
    price: 299,
    image: "https://via.placeholder.com/150",
    description: "Description of Product B",
  },
  {
    id: "3",
    name: "Product C",
    price: 399,
    image: "https://via.placeholder.com/150",
    description: "Description of Product C",
  },
];

const ProductScreen = ({ navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => alert(`Selected: ${item.name}`)}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>฿{item.price}</Text>
        <Text style={styles.productDesc}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products</Text>
        <View style={{ width: 28 }} /> {/* เพื่อให้ title อยู่กึ่งกลาง */}
      </View>

      {/* Product List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default ProductScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productInfo: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6347",
    marginBottom: 6,
  },
  productDesc: {
    fontSize: 12,
    color: "#666",
  },
});
