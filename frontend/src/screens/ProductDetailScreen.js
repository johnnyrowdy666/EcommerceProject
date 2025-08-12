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
import { getProductById, getApiBaseUrl } from "../services/api";
import { useCart } from "../component/CartContext";
import { useUser } from "../component/UserContext";
import Icon from "react-native-vector-icons/Ionicons";

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const { addToCart, isInCart, getCartItemQuantity } = useCart();
  const { isAuthenticated } = useUser();

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

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      Alert.alert(
        "กรุณาเข้าสู่ระบบ",
        "คุณต้องเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า",
        [
          { text: "ยกเลิก", style: "cancel" },
          { text: "เข้าสู่ระบบ", onPress: () => navigation.navigate("Login") },
        ]
      );
      return;
    }

    if (product.stock <= 0) {
      Alert.alert("สินค้าหมด", "สินค้านี้หมดแล้ว");
      return;
    }

    if (product.stock < quantity) {
      Alert.alert("สินค้าไม่เพียงพอ", `เหลือเพียง ${product.stock} ชิ้น`);
      return;
    }

    addToCart(product, quantity);
    Alert.alert("เพิ่มลงตะกร้าแล้ว", `${product.title} ถูกเพิ่มลงตะกร้าแล้ว`);
  };

  const getImageSource = (imageUri) => {
    if (!imageUri) return require("../assets/Logo.jpg");

    if (imageUri.startsWith("/uploads/")) {
      const baseUrl = getApiBaseUrl().replace("/api", "");
      return { uri: `${baseUrl}${imageUri}` };
    }

    return { uri: imageUri };
  };

  if (!product) return <Text>Loading...</Text>;

  const cartQuantity = getCartItemQuantity(product.id);
  const isProductInCart = isInCart(product.id);

  return (
    <ScrollView style={styles.container}>
      <Image source={getImageSource(product.image_uri)} style={styles.productImage} />

      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>฿{parseFloat(product.price).toLocaleString()}</Text>

        {/* Seller Information */}
        {product.seller_username && (
          <View style={styles.sellerInfo}>
            <Icon name="person-circle-outline" size={20} color="#666" />
            <Text style={styles.sellerName}>
              Seller: {product.seller_username}
            </Text>
          </View>
        )}

        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>Category: {product.category}</Text>
          {product.size && <Text style={styles.metaText}>Size: {product.size}</Text>}
          {product.color && <Text style={styles.metaText}>Color: {product.color}</Text>}
          <Text style={styles.metaText}>Stock: {product.stock} ชิ้น</Text>
        </View>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Icon 
              name="remove-circle-outline" 
              size={30} 
              color={quantity <= 1 ? "#ccc" : "#ff6f61"} 
            />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity 
            onPress={() => setQuantity(quantity + 1)}
            disabled={quantity >= product.stock}
          >
            <Icon 
              name="add-circle-outline" 
              size={30} 
              color={quantity >= product.stock ? "#ccc" : "#ff6f61"} 
            />
          </TouchableOpacity>
        </View>

        {isProductInCart && (
          <View style={styles.inCartInfo}>
            <Icon name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.inCartText}>
              ในตะกร้าแล้ว ({cartQuantity} ชิ้น)
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.addToCartButton,
            (isProductInCart || product.stock <= 0) && styles.disabledButton
          ]}
          onPress={handleAddToCart}
          disabled={isProductInCart || product.stock <= 0}
        >
          <Text style={styles.addToCartText}>
            {isProductInCart ? "ในตะกร้าแล้ว" : 
             product.stock <= 0 ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
          </Text>
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
  metaText: {
    fontSize: 16,
    marginBottom: 5,
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
  inCartInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 15,
  },
  inCartText: {
    marginLeft: 5,
    fontSize: 16,
    color: "#4CAF50",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
});

export default ProductDetailScreen;
