import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadProduct, getCategories } from "../services/api";
import { useUser } from "../component/UserContext";
import { useNavigation } from "@react-navigation/native";

export default function PostScreen({ navigation }) {
  const { isAuthenticated, user } = useUser();
  const nav = useNavigation();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [stock, setStock] = useState("1");
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        "Authentication Required",
        "You need to be logged in to post products",
        [
          {
            text: "Login",
            onPress: () => nav.navigate("Login"),
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => nav.goBack(),
          },
        ]
      );
      return;
    }
  }, [isAuthenticated, nav]);

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "อนุญาตเข้าถึงรูปภาพ",
          "ต้องการอนุญาตการเข้าถึงรูปภาพเพื่ออัปโหลดรูปสินค้า"
        );
      }
    })();

    loadCategories();
  }, []);

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <ActivityIndicator size="large" color="#ff6f61" />
        <Text style={styles.authText}>Checking authentication...</Text>
      </View>
    );
  }

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const categoriesData = await getCategories();
      console.log("Categories data:", categoriesData);

      if (categoriesData && Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else {
        setCategories([
          { id: 1, name: "เสื้อ" },
          { id: 2, name: "กางเกง" },
          { id: 3, name: "รองเท้า" },
          { id: 4, name: "เครื่องประดับ" },
          { id: 5, name: "อื่นๆ" },
        ]);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([
        { id: 1, name: "เสื้อ" },
        { id: 2, name: "กางเกง" },
        { id: 3, name: "รองเท้า" },
        { id: 4, name: "เครื่องประดับ" },
        { id: 5, name: "อื่นๆ" },
      ]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        setImageUri(res.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเลือกภาพได้");
    }
  };

  const validateInputs = () => {
    const errors = [];

    if (!title.trim()) errors.push("ชื่อสินค้า");
    if (!price.trim()) errors.push("ราคา");
    if (!desc.trim()) errors.push("รายละเอียด");
    if (!category.trim()) errors.push("หมวดหมู่");
    if (!imageUri) errors.push("รูปภาพสินค้า");

    if (price.trim() && (isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
      errors.push("ราคาต้องเป็นตัวเลขที่มากกว่า 0");
    }

    if (stock.trim() && (isNaN(parseInt(stock)) || parseInt(stock) <= 0)) {
      errors.push("จำนวนสินค้าต้องเป็นตัวเลขที่มากกว่า 0");
    }

    return errors;
  };

  const handlePost = async () => {
    const validationErrors = validateInputs();

    if (validationErrors.length > 0) {
      Alert.alert(
        "กรอกข้อมูลให้ครบ",
        `โปรดกรอก: ${validationErrors.join(", ")}`
      );
      return;
    }

    setLoading(true);

    try {
      const productData = {
        title: title.trim(),
        description: desc.trim(),
        price: parseFloat(price),
        category: category.trim(),
        size: size.trim() || undefined,
        color: color.trim() || undefined,
        stock: parseInt(stock) || 1,
        imageUri: imageUri,
      };

      const response = await uploadProduct(productData);

      Alert.alert("โพสต์สำเร็จ", `สินค้า "${title}" ได้ถูกเพิ่มเรียบร้อยแล้ว`, [
        {
          text: "ตกลง",
          onPress: () => {
            resetForm();
            navigation.navigate("Home");
          },
        },
      ]);
    } catch (error) {
      console.error("Error uploading product:", error);
      Alert.alert(
        "เกิดข้อผิดพลาด",
        error.message || "ไม่สามารถโพสต์สินค้าได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setPrice("");
    setDesc("");
    setImageUri(null);
    setCategory("");
    setSize("");
    setColor("");
    setStock("1");
  };

  const selectCategory = (selectedCategory) => {
    setCategory(selectedCategory.name);
    setShowCategoryModal(false);
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => selectCategory(item)}
    >
      <Text style={styles.categoryItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>เพิ่มสินค้าใหม่</Text>

      <Text style={styles.label}>รูปสินค้า *</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imageHintContainer}>
            <Text style={styles.imageHint}>แตะเพื่อเลือกภาพ</Text>
            <Text style={styles.imageSubHint}>แนะนำขนาด 4:3</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>ชื่อสินค้า *</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholder="เช่น เสื้อยืดสีขาว"
        maxLength={100}
      />

      <Text style={styles.label}>หมวดหมู่ *</Text>
      <TouchableOpacity
        style={styles.categorySelector}
        onPress={() => setShowCategoryModal(true)}
      >
        {categoriesLoading ? (
          <ActivityIndicator size="small" color="#666" />
        ) : (
          <Text
            style={category ? styles.categoryText : styles.categoryPlaceholder}
          >
            {category || "เลือกหมวดหมู่สินค้า"}
          </Text>
        )}
        <Text style={styles.categoryArrow}>▼</Text>
      </TouchableOpacity>

      <Text style={styles.label}>ราคา (บาท) *</Text>
      <TextInput
        value={price}
        onChangeText={setPrice}
        style={styles.input}
        placeholder="0.00"
        keyboardType="decimal-pad"
        maxLength={10}
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>ไซส์</Text>
          <TextInput
            value={size}
            onChangeText={setSize}
            style={styles.input}
            placeholder="S, M, L, XL"
            maxLength={20}
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>สี</Text>
          <TextInput
            value={color}
            onChangeText={setColor}
            style={styles.input}
            placeholder="แดง, น้ำเงิน"
            maxLength={30}
          />
        </View>
      </View>

      <Text style={styles.label}>จำนวนสินค้า</Text>
      <TextInput
        value={stock}
        onChangeText={setStock}
        style={styles.input}
        placeholder="1"
        keyboardType="numeric"
        maxLength={5}
      />

      <Text style={styles.label}>รายละเอียดสินค้า *</Text>
      <TextInput
        value={desc}
        onChangeText={setDesc}
        style={[styles.input, styles.textArea]}
        placeholder="อธิบายรายละเอียดสินค้าของคุณ..."
        multiline
        maxLength={500}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={resetForm}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>รีเซ็ต</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            loading && styles.disabledButton,
          ]}
          onPress={handlePost}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "กำลังโพสต์..." : "โพสต์สินค้า"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เลือกหมวดหมู่</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {categoriesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6f61" />
              </View>
            ) : (
              <FlatList
                data={categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id?.toString() || item.name}
                style={styles.categoryList}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>ไม่มีหมวดหมู่</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
    fontSize: 16,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  imagePicker: {
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e6e6e6",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  imageHintContainer: {
    alignItems: "center",
  },
  imageHint: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
  },
  imageSubHint: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  categorySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fafafa",
  },
  categoryText: {
    fontSize: 16,
    color: "#333",
  },
  categoryPlaceholder: {
    fontSize: 16,
    color: "#888",
  },
  categoryArrow: {
    fontSize: 12,
    color: "#666",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#ff6f61",
  },
  secondaryButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 20,
    color: "#666",
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryItemText: {
    fontSize: 16,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
  loadingContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  authContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  authText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
});
