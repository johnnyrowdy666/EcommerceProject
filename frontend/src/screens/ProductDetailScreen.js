import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { getProductById, createOrder } from "../services/api";
import Icon from "react-native-vector-icons/Ionicons";

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(productId);
        setProduct(data);
      } catch (error) {
        Alert.alert("Error", "Failed to load product details");
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    try {
      await createOrder(productId, quantity);
      Alert.alert("Success", "Product added to cart");
      navigation.navigate("Cart");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  if (!product) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image_uri }} style={styles.productImage} />

      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>

        <View style={styles.sellerInfo}>
          <Image
            source={{
              uri: product.seller_image || "https://via.placeholder.com/50",
            }}
            style={styles.sellerImage}
          />
          <Text style={styles.sellerName}>Sold by: {product.seller_name}</Text>
        </View>

        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.metaContainer}>
          <Text>Category: {product.category}</Text>
          <Text>Size: {product.size}</Text>
          <Text>Color: {product.color}</Text>
        </View>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Icon name="remove-circle-outline" size={30} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity onPress={() => setQuantity(quantity + 1)}>
            <Icon name="add-circle-outline" size={30} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  productImage: {
    width: "100%",
    height: 300,
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  price: {
    fontSize: 22,
    color: "#ff6f61",
    fontWeight: "bold",
    marginBottom: 15,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sellerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  sellerName: {
    fontSize: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  metaContainer: {
    marginBottom: 20,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  quantityText: {
    fontSize: 20,
    marginHorizontal: 15,
  },
  addToCartButton: {
    backgroundColor: "#ff6f61",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  addToCartText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ProductDetailScreen;
