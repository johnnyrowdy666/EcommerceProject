import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import React, { useState, useEffect, useContext } from "react";
import Header from "../component/Header";
import { fontSize, iconSize, spacing } from "../constants/dimensions";
import { fontFamily } from "../constants/fontFamily";
import CustomInput from "../component/CustomInput";
import Feather from "react-native-vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { updateUserImage } from "../services/api";
import { UserContext } from "../component/UserContext";
import { useNavigation } from "@react-navigation/native";

const ProfileScreen = () => {
  const { user, logout } = useContext(UserContext);
  const [imageUri, setImageUri] = useState(user?.image_uri || null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (user?.image_uri) {
      setImageUri(user.image_uri);
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
      setImageUri(user?.image_uri || null);
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={[styles.role, { color: "#666666" }]}>Test user</Text>
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
        onPress={() => {
          logout();
          navigation.navigate("Onboard");
        }}
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
  role: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
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
