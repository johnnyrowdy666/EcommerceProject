import React, { createContext, useContext, useState, useEffect } from 'react';

// ตรวจสอบ environment อย่างถูกต้อง
let AsyncStorage;
if (typeof window !== 'undefined' && window.localStorage) {
  // Web environment - ใช้ localStorage
  AsyncStorage = {
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
  };
} else {
  // React Native environment - ใช้ AsyncStorage
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
}

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const role = user?.role || null;

  const hasRole = (requiredRole) => {
    if (!user || !user.role) {
      console.log("🚫 hasRole: No user or role found");
      return false;
    }
    
    const userRole = user.role.toLowerCase();
    const checkRole = requiredRole.toLowerCase();
    
    console.log(`🔍 hasRole check: User role '${userRole}' vs Required '${checkRole}'`);
    
    if (checkRole === 'admin') {
      return userRole === 'admin';
    } else if (checkRole === 'user') {
      return userRole === 'user' || userRole === 'admin';
    }
    
    return userRole === checkRole;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("🔄 Initializing authentication...");
        
        const [storedToken, storedUserData] = await Promise.all([
          AsyncStorage.getItem("token"),
          AsyncStorage.getItem("user")
        ]);

        console.log("🔍 Stored data check:", {
          hasToken: !!storedToken,
          hasUser: !!storedUserData,
          tokenStart: storedToken ? storedToken.substring(0, 10) + "..." : "none"
        });

        if (storedToken && storedUserData) {
          const userData = JSON.parse(storedUserData);
          console.log("✅ Restoring user session:", {
            id: userData.id,
            username: userData.username,
            role: userData.role
          });
          
          setToken(storedToken);
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          console.log("ℹ️ No stored session found");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (userData, authToken) => {
    try {
      console.log("🔐 UserContext login called:", {
        userData: userData,
        hasToken: !!authToken
      });

      if (!userData || !authToken) {
        throw new Error("Invalid login data");
      }

      await Promise.all([
        AsyncStorage.setItem("token", authToken),
        AsyncStorage.setItem("user", JSON.stringify(userData))
      ]);

      setUser(userData);
      setToken(authToken);
      setIsAuthenticated(true);

      console.log("✅ UserContext login successful:", {
        id: userData.id,
        username: userData.username,
        role: userData.role
      });

      return true;
    } catch (error) {
      console.error("❌ UserContext login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("🔓 UserContext logout called");
      
      const imageUri = user?.imageUri || null;
      
      await AsyncStorage.removeItem("token");
      await AsyncStorage.setItem("user", JSON.stringify({ imageUri }));

      setUser(null);
      setToken(null);
      setIsAuthenticated(false);

      console.log("✅ UserContext logout successful");
    } catch (error) {
      console.error("❌ UserContext logout error:", error);
    }
  };

  const updateUser = async (newUserData) => {
    try {
      console.log("🔄 Updating user data:", newUserData);
      
      const updatedUser = { ...user, ...newUserData };
      
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      console.log("✅ User data updated successfully");
      return updatedUser;
    } catch (error) {
      console.error("❌ Update user error:", error);
      throw error;
    }
  };

  const isAdmin = () => hasRole('admin');
  const isUser = () => hasRole('user');

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    role,
    login,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    isUser,
    debugInfo: () => ({
      user,
      token: token ? token.substring(0, 10) + "..." : null,
      isAuthenticated,
      role,
    })
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;