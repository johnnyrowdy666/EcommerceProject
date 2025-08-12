import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { getProducts, getCategories } from "../services/api";
import ProductCard from "../components/ProductCard";

const { width } = Dimensions.get("window");

const HomeScreen = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  // Refresh data when screen comes into focus (important for when user adds new product)
  useFocusEffect(
    useCallback(() => {
      console.log("HomeScreen focused - refreshing data");
      fetchData();
    }, [])
  );

  const fetchData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log("Fetching products and categories...");

      // Fetch data in parallel with proper error handling
      const [productsData, categoriesData] = await Promise.allSettled([
        getProducts(),
        getCategories(),
      ]);

      // Handle products data
      if (productsData.status === "fulfilled") {
        console.log(`Loaded ${productsData.value.length} products`);
        setProducts(productsData.value);
        setFeaturedProducts(productsData.value.slice(0, 6));
      } else {
        console.error("Failed to load products:", productsData.reason);
        throw new Error("Failed to load products");
      }

      // Handle categories data (optional, don't fail if categories fail)
      if (categoriesData.status === "fulfilled") {
        console.log(`Loaded ${categoriesData.value.length} categories`);
        setCategories(categoriesData.value);
      } else {
        console.warn("Failed to load categories:", categoriesData.reason);
        setCategories([]); // Set empty array if categories fail
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to load data");

      // Show user-friendly error message
      if (!showRefreshing) {
        Alert.alert(
          "ไม่สามารถโหลดข้อมูลได้",
          "กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง",
          [
            { text: "ลองใหม่", onPress: () => fetchData() },
            { text: "ยกเลิก", style: "cancel" },
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    console.log("Manual refresh triggered");
    fetchData(true);
  }, [fetchData]);

  const handleCategoryPress = useCallback(
    (category) => {
      navigation.navigate("ProductsByCategory", { category: category.name });
    },
    [navigation]
  );

  const handleViewAllProducts = useCallback(() => {
    navigation.navigate("Search");
  }, [navigation]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.welcomeText}>ยินดีต้อนรับ!</Text>
          <Text style={styles.headerTitle}>ค้นหาสินค้าที่คุณต้องการ</Text>
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate("Search")}
        >
          <Icon name="search" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoriesSection = () => {
    if (categories.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>หมวดหมู่สินค้า</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Categories")}>
            <Text style={styles.viewAllText}>ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.slice(0, 8).map((category, index) => (
            <TouchableOpacity
              key={category.id || index}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(category)}
            >
              <View style={styles.categoryIcon}>
                <Icon name="apps" size={24} color="#ff6f61" />
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderFeaturedSection = () => {
    if (featuredProducts.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>สินค้าแนะนำ</Text>
          <TouchableOpacity onPress={handleViewAllProducts}>
            <Text style={styles.viewAllText}>ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={featuredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => `featured_${item.id}`}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.featuredGrid}
        />
      </View>
    );
  };

  const renderRecentSection = () => {
    const recentProducts = products.slice(6, 12);
    if (recentProducts.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>สินค้าล่าสุด</Text>
          <TouchableOpacity onPress={handleViewAllProducts}>
            <Text style={styles.viewAllText}>ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={recentProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => `recent_${item.id}`}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.recentGrid}
        />
      </View>
    );
  };

  const renderProduct = useCallback(
    ({ item }) => (
      <ProductCard
        product={item}
        style={styles.productCardStyle}
        onPress={() =>
          navigation.navigate("ProductDetail", { productId: item.id })
        }
      />
    ),
    [navigation]
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bag-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>ยังไม่มีสินค้า</Text>
      <Text style={styles.emptySubText}>เริ่มต้นขายสินค้าของคุณได้เลย!</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => navigation.navigate("Post")}
      >
        <Text style={styles.retryButtonText}>ลงขายสินค้า</Text>
      </TouchableOpacity>
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
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
        <Text style={styles.retryButtonText}>ลองใหม่</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && products.length === 0) {
    return renderLoadingComponent();
  }

  if (error && products.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#ff6f61"]}
            tintColor="#ff6f61"
          />
        }
      >
        {renderHeader()}
        {renderErrorComponent()}
      </ScrollView>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#ff6f61"]}
            tintColor="#ff6f61"
          />
        }
      >
        {renderHeader()}
        {renderEmptyComponent()}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#ff6f61"]}
          tintColor="#ff6f61"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {renderHeader()}
      {renderCategoriesSection()}
      {renderFeaturedSection()}
      {renderRecentSection()}
    </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginTop: 4,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    backgroundColor: "white",
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  viewAllText: {
    fontSize: 14,
    color: "#ff6f61",
    fontWeight: "600",
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 20,
    width: 70,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff5f4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
  featuredGrid: {
    marginHorizontal: -6,
  },
  recentGrid: {
    marginHorizontal: -6,
  },
  productCardStyle: {
    margin: 6,
    width: (width - 52) / 2,
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

export default HomeScreen;
