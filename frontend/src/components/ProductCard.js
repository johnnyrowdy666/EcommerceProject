// components/ProductCard.js
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const ProductCard = ({ product, style, onPress }) => {
  // Format price with commas
  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString("th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Get image source
  const getImageSource = (imageUri) => {
    if (!imageUri) return require("../assets/Logo.jpg");

    // If it's a local file path (starts with /uploads/), prepend the API base URL
    if (imageUri.startsWith("/uploads/")) {
      return { uri: `http://192.168.0.102:5000${imageUri}` };
    }

    // If it's already a full URI
    return { uri: imageUri };
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={getImageSource(product.image_uri)}
          style={styles.image}
          resizeMode="cover"
        />
        {product.stock <= 0 && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>หมด</Text>
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>฿{formatPrice(product.price)}</Text>
          {product.stock > 0 && (
            <Text style={styles.stock}>เหลือ {product.stock}</Text>
          )}
        </View>

        <View style={styles.metaContainer}>
          <View style={styles.categoryContainer}>
            <Icon name="pricetag-outline" size={12} color="#666" />
            <Text style={styles.category} numberOfLines={1}>
              {product.category}
            </Text>
          </View>

          {product.seller_name && (
            <View style={styles.sellerContainer}>
              <Icon name="person-outline" size={12} color="#666" />
              <Text style={styles.seller} numberOfLines={1}>
                {product.seller_name}
              </Text>
            </View>
          )}
        </View>

        {(product.size || product.color) && (
          <View style={styles.attributesContainer}>
            {product.size && (
              <Text style={styles.attribute}>{product.size}</Text>
            )}
            {product.color && (
              <Text style={styles.attribute}>{product.color}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 160,
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  contentContainer: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ff6f61",
  },
  stock: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaContainer: {
    marginBottom: 6,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  sellerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  seller: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  attributesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  attribute: {
    fontSize: 11,
    color: "#999",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 4,
    marginBottom: 2,
  },
});

export default ProductCard;
