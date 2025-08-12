import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import React, { useState, useContext } from "react";
import { colors } from "../utils/colors";
import { fonts } from "../utils/fonts";
import { loginUser } from "../services/api";
import AntDesign from "react-native-vector-icons/AntDesign";
import Ionicons from "react-native-vector-icons/Ionicons";
import SimpleLineIcons from "react-native-vector-icons/SimpleLineIcons";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../component/UserContext";

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useUser();

  const [secureEntry, setSecureEntry] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const gotoSignup = () => {
    navigation.navigate("Regis");
  };

  const handleLogin = async () => {
    if (loading) return;

    try {
      if (!username || !password) {
        Alert.alert("Error", "Please enter username and password");
        return;
      }

      setLoading(true);
      const userData = await loginUser(username, password);

      console.log("Login User Data:", JSON.stringify(userData, null, 2));

      // Pass both user data and token to context
      await login(userData.user, userData.token);

      // ✅ Role-based Navigation
      const userRole = userData.user?.role;
      console.log("User role:", userRole);

      if (userRole === "admin") {
        Alert.alert("Admin Login Successful", "Welcome to Admin Dashboard!", [
          {
            text: "OK",
            onPress: () => navigation.replace("AdminDashboard"), // Navigate to Admin Dashboard
          },
        ]);
      } else {
        Alert.alert("Login Successful", "You have successfully logged in!", [
          {
            text: "OK",
            onPress: () => navigation.replace("MainTabs"), // Navigate to Main App
          },
        ]);
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButtonWrapper} onPress={handleGoBack}>
        <Ionicons name={"arrow-back-outline"} color={"white"} size={25} />
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text style={styles.headingText}>Login</Text>
      </View>
      {/* form  */}
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <AntDesign name={"user"} size={30} color={"black"} />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your username"
            placeholderTextColor={"black"}
            value={username}
            onChangeText={setUsername}
            editable={!loading}
          />
        </View>
        <View style={styles.inputContainer}>
          <SimpleLineIcons name={"lock"} size={30} color={"black"} />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your password"
            placeholderTextColor={"black"}
            secureTextEntry={secureEntry}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => {
              setSecureEntry((prev) => !prev);
            }}
          >
            <SimpleLineIcons name={"eye"} size={20} color={colors.black} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.loginButtonWrapper, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginText}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.continueText}>or continue with</Text>
        <TouchableOpacity style={styles.googleButtonContainer}>
          <Image
            source={require("../assets/google.png")}
            style={styles.googleImage}
          />
          <Text style={styles.googleText}>Google</Text>
        </TouchableOpacity>
        <View style={styles.footerContainer}>
          <Text style={styles.accountText}>Don't have an account?</Text>
          <TouchableOpacity onPress={gotoSignup}>
            <Text style={styles.signupText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
  },
  backButtonWrapper: {
    height: 40,
    width: 40,
    backgroundColor: "black",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    marginVertical: 20,
  },
  headingText: {
    fontSize: 32,
    color: "black",
    fontWeight: "bold",
  },
  formContainer: {
    marginTop: 20,
  },
  inputContainer: {
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 100,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 2,
    marginVertical: 10,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontFamily: fonts.Light,
  },
  forgotPasswordText: {
    textAlign: "right",
    color: "black",
    fontFamily: fonts.SemiBold,
    marginVertical: 10,
  },
  loginButtonWrapper: {
    backgroundColor: "black",
    borderRadius: 100,
    marginTop: 20,
  },
  loginButtonDisabled: {
    backgroundColor: "#666",
  },
  loginText: {
    color: colors.white,
    fontSize: 20,
    fontFamily: fonts.SemiBold,
    textAlign: "center",
    padding: 10,
  },
  continueText: {
    textAlign: "center",
    marginVertical: 20,
    fontSize: 14,
    fontFamily: fonts.Regular,
    color: "black",
  },
  googleButtonContainer: {
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },
  googleImage: {
    height: 20,
    width: 20,
  },
  googleText: {
    fontSize: 20,
    fontFamily: fonts.SemiBold,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
    gap: 5,
  },
  accountText: {
    color: "black",
    fontFamily: fonts.Regular,
  },
  signupText: {
    color: "black",
    fontWeight: "bold",
  },
});

export default LoginScreen;