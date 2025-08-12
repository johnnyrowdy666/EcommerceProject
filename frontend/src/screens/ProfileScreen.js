import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import Header from "../component/Header";
import { fontSize, iconSize, spacing } from "../constants/dimensions";
import { fontFamily } from "../constants/fontFamily";
import CustomInput from "../component/CustomInput";
import Feather from "react-native-vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { updateUserImage } from "../services/api";
import { useUser } from "../component/UserContext";
import { useNavigation } from "@react-navigation/native";

const ProfileScreen = () => {
  const { user, logout, isAuthenticated, role } = useUser();
  const [imageUri, setImageUri] = useState(user?.image_uri || user?.imageUri || null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (user?.image_uri || user?.imageUri) {
      setImageUri(user.image_uri || user.imageUri);
    }

    const requestPermissions = async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Permission to access media library is required!"
        );
      }
    };

    requestPermissions();
  }, [user]);

  const handleImagepick = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      if (!user || !user.username) {
        Alert.alert(
          "Error",
          "User information is missing. Please log in again."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        if (!selectedImageUri) {
          throw new Error("Failed to get image URI");
        }

        setImageUri(selectedImageUri);

        const response = await updateUserImage(user.username, selectedImageUri);
        if (response && response.message) {
          Alert.alert("Success", response.message);
        } else {
          Alert.alert("Success", "Image updated successfully!");
        }
      }
    } catch (error) {
      Alert.alert("Upload failed", error.message);
      setImageUri(user?.image_uri || user?.imageUri || null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.navigate("Onboard");
          },
        },
      ]
    );
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <ScrollView style={styles.container}>
        <Header />
        <View style={styles.guestContainer}>
          <Text style={styles.guestTitle}>Not Logged In</Text>
          <Text style={styles.guestText}>Please log in to view your profile</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: "#FFFFFF" }]}
      contentContainerStyle={{ paddingBottom: 2 * spacing.xl }}
    >
      <Header />
      <View style={styles.profileImageContainer}>
        <Image
          source={imageUri ? { uri: imageUri } : require("../assets/dp.png")}
          onError={() => setImageUri(null)}
          style={styles.profileImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={[styles.editIconContainer, { backgroundColor: "#FF7F50" }]}
          onPress={handleImagepick}
          disabled={isLoading}
        >
          <Feather
            name={isLoading ? "loader" : "edit-3"}
            size={iconSize.md}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.nameRoleContainer}>
        <Text style={[styles.name, { color: "#000000" }]}>
          Hello!!! {user?.username || "Guest"}
        </Text>
        <View style={styles.roleContainer}>
          <Text style={[styles.role, { color: "#666666" }]}>
            Role: {role || "user"}
          </Text>
          {role === "admin" && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate("AdminDashboard")}
            >
              <Text style={styles.adminButtonText}>Admin Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.inputFieldsContainer}>
        <CustomInput
          label="Your Email"
          placeholder={user?.email || "No email available"}
          value={user?.email || ""}
          editable={false}
        />
        <CustomInput
          label="Your username"
          placeholder={user?.username || "No username available"}
          value={user?.username || ""}
          editable={false}
        />
        <CustomInput
          label="Phone Number"
          placeholder={user?.phone || "No phone available"}
          value={user?.phone || ""}
          editable={false}
        />
        <CustomInput
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          editable={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: "#FF7F50" }]}
        onPress={handleLogout}
      >
        <Text style={[styles.logoutText, { color: "#FF7F50" }]}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  guestTitle: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: "#333",
    marginBottom: 10,
  },
  guestText: {
    fontSize: fontSize.md,
    color: "#666",
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: "#FF7F50",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "white",
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
  },
  profileImageContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
  },
  profileImage: {
    height: 140,
    width: 140,
    borderRadius: 70,
  },
  editIconContainer: {
    height: 35,
    width: 35,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -22,
    marginLeft: 100,
  },
  nameRoleContainer: {
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  name: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
  },
  roleContainer: {
    alignItems: "center",
    marginTop: 5,
  },
  role: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
  },
  adminButton: {
    backgroundColor: "#FF7F50",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  adminButtonText: {
    color: "white",
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
  },
  inputFieldsContainer: {
    marginVertical: spacing.md,
  },
  logoutButton: {
    borderWidth: 1,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginVertical: spacing.md,
  },
  logoutText: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
  },
});
