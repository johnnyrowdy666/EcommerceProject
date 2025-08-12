// components/ProductCard.js
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { getApiBaseUrl } from "../services/api";

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
      const baseUrl = getApiBaseUrl().replace("/api", ""); // Remove /api from base URL
      return { uri: `${baseUrl}${imageUri}` };
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

        <View style={styles.detailsContainer}>
          {product.category && (
            <Text style={styles.category} numberOfLines={1}>
              {product.category}
            </Text>
          )}
          
          <View style={styles.attributesContainer}>
            {product.size && (
              <Text style={styles.attribute}>Size: {product.size}</Text>
            )}
            {product.color && (
              <Text style={styles.attribute}>Color: {product.color}</Text>
            )}
          </View>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.price}>฿{formatPrice(product.price)}</Text>
          <View style={styles.stockContainer}>
            <Icon
              name={product.stock > 0 ? "checkmark-circle" : "close-circle"}
              size={16}
              color={product.stock > 0 ? "#4CAF50" : "#f44336"}
            />
            <Text
              style={[
                styles.stockText,
                {
                  color: product.stock > 0 ? "#4CAF50" : "#f44336",
                },
              ]}
            >
              {product.stock > 0 ? `Stock: ${product.stock}` : "Out of stock"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 150,
    backgroundColor: "#f5f5f5",
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#f44336",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  outOfStockText: {
    color: "white",
    fontSize: 12,
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
  detailsContainer: {
    marginBottom: 12,
  },
  category: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  attributesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  attribute: {
    fontSize: 12,
    color: "#888",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ff6f61",
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stockText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default ProductCard;
