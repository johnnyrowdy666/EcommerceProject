import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { View, ActivityIndicator, StyleSheet } from "react-native";

import { UserProvider, useUser } from "./src/component/UserContext";
import { CartProvider } from "./src/component/CartContext";

import AdminDashboard from "./src/screens/AdminDashboard";
import CartScreen from "./src/screens/CartScreen";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import OnboardScreen from "./src/screens/OnboardScreen";
import OrderScreen from "./src/screens/OrderScreen";
import PostScreen from "./src/screens/PostScreen";
import ProductScreen from "./src/screens/ProductScreen";
import ProductsByCategory from "./src/screens/ProductsByCategory";
import ProfileScreen from "./src/screens/ProfileScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import SearchScreen from "./src/screens/SearchScreen";
import SellScreen from "./src/screens/SellScreen";
import SettingScreen from "./src/screens/SettingScreen";
import ProductDetailScreen from "./src/screens/ProductDetailScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "Search")
            iconName = focused ? "search" : "search-outline";
          else if (route.name === "Cart")
            iconName = focused ? "cart" : "cart-outline";
          else if (route.name === "Post")
            iconName = focused ? "add-circle" : "add-circle-outline";
          else if (route.name === "Profile")
            iconName = focused ? "person" : "person-outline";
          else iconName = "ellipse";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#FF6347",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Post" component={PostScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboard"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboard" component={OnboardScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Regis" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { role } = useUser();
  
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="OrderScreen" component={OrderScreen} />
      <Stack.Screen name="ProductScreen" component={ProductScreen} />
      <Stack.Screen name="ProductsByCategory" component={ProductsByCategory} />
      <Stack.Screen name="SellScreen" component={SellScreen} />
      <Stack.Screen name="SettingScreen" component={SettingScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      {/* Admin-only screens */}
      {role === "admin" && (
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      )}
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { loading, isAuthenticated } = useUser();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6347" />
      </View>
    );
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <CartProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </CartProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
