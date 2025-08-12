import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser as fetchCurrentUser } from "../services/api";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // เก็บข้อมูล user (รวม imageUri)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // โหลดข้อมูล user จาก AsyncStorage หรือ fetch จาก server (ถ้ามี token)
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // หรือถ้าต้องการ fetch user จาก API ด้วย token
          // const freshUser = await fetchCurrentUser();
          // setUser(freshUser);
        }
      } catch (error) {
        console.error("Failed to load user data", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (userData, token) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      await AsyncStorage.setItem("token", token);
      setUser(userData);
    } catch (error) {
      console.error("Login storage error", error);
    }
  };

  const logout = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      let imageUri = null;
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        imageUri = parsed.imageUri || null;
      }
      // เก็บ imageUri ไว้ แต่ล้าง token และข้อมูลอื่น ๆ
      await AsyncStorage.setItem("user", JSON.stringify({ imageUri }));
      await AsyncStorage.removeItem("token");
      setUser({ imageUri });
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
