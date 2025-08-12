import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getProductsByCategory } from "../services/api";
import ProductCard from "../components/ProductCard";
import Icon from "react-native-vector-icons/Ionicons";

const ProductsByCategory = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { category } = route.params || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (category) {
      fetchProducts();
    }
  }, [category]);

  const fetchProducts = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await getProductsByCategory(category);
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      setError(error.message || "Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchProducts(true);
  };

  const handleProductPress = (productId) => {
    navigation.navigate("ProductDetail", { productId });
  };

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onPress={() => handleProductPress(item.id)}
      style={styles.productCard}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bag-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>ไม่มีสินค้าในหมวดหมู่ {category}</Text>
      <Text style={styles.emptySubText}>ลองดูหมวดหมู่อื่นหรือกลับมาทีหลัง</Text>
    </View>
  );

  const renderLoadingComponent = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#ff6f61" />
      <Text style={styles.loadingText}>กำลังโหลดสินค้า...</Text>
    </View>
  );

  const renderErrorComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="alert-circle-outline" size={64} color="#ff6f61" />
      <Text style={styles.emptyText}>เกิดข้อผิดพลาด</Text>
      <Text style={styles.emptySubText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchProducts()}>
        <Text style={styles.retryButtonText}>ลองใหม่</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && products.length === 0) {
    return renderLoadingComponent();
  }

  if (error && products.length === 0) {
    return (
      <View style={styles.container}>
        {renderErrorComponent()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#ff6f61"]}
            tintColor="#ff6f61"
          />
        }
        ListEmptyComponent={renderEmptyComponent()}
        ListHeaderComponent={
          products.length > 0 ? (
            <Text style={styles.resultCount}>
              พบ {products.length} สินค้าในหมวดหมู่ {category}
            </Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  productList: {
    padding: 8,
  },
  productCard: {
    margin: 8,
    flex: 1,
  },
  resultCount: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 16,
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "600",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#ff6f61",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProductsByCategory;
