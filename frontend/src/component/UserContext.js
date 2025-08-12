import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser as fetchCurrentUser } from "../services/api";

const STORAGE_KEYS = {
  user: "user",
  token: "token",
};

export const UserContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  role: null,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  setUser: () => {},
  updateUser: async () => {},
  hasRole: () => false,
  hasAnyRole: () => false,
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // includes imageUri if present
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  // Derived auth state
  const isAuthenticated = hasToken;
  const role = user?.role ?? null;

  const refreshUser = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
      if (!token) {
        setHasToken(false);
        return null;
      }
      
      setHasToken(true);
      const freshUser = await fetchCurrentUser();
      if (freshUser) {
        await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(freshUser));
        setUser(freshUser);
        return freshUser;
      }
      return null;
    } catch (error) {
      console.error("Failed to refresh user", error);
      // If refresh fails, clear auth state
      await AsyncStorage.removeItem(STORAGE_KEYS.token);
      setHasToken(false);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      try {
        const [storedUser, token] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.user),
          AsyncStorage.getItem(STORAGE_KEYS.token),
        ]);

        if (!isMounted) return;

        setHasToken(!!token);

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // If we have a token, try to refresh user data
          if (token) {
            await refreshUser();
          }
        } else if (token) {
          // We have a token but no stored user, try to fetch
          await refreshUser();
        }
      } catch (error) {
        console.error("Failed to load user data", error);
        setHasToken(false);
        setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [refreshUser]);

  const login = useCallback(async (userData, token) => {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.user, JSON.stringify(userData)],
        [STORAGE_KEYS.token, token],
      ]);
      setUser(userData);
      setHasToken(true);
    } catch (error) {
      console.error("Login storage error", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Preserve imageUri if it exists
      const imageUri =
        (user && user.imageUri) ||
        (user && user.image_uri) ||
        null;

      await AsyncStorage.setItem(
        STORAGE_KEYS.user,
        JSON.stringify({ imageUri })
      );
      await AsyncStorage.removeItem(STORAGE_KEYS.token);
      setUser({ imageUri });
      setHasToken(false);
    } catch (error) {
      console.error("Logout error", error);
    }
  }, [user]);

  const updateUser = useCallback(
    async (partial) => {
      try {
        const updatedUser = { ...(user || {}), ...partial };
        await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
        setUser(updatedUser);
      } catch (error) {
        console.error("Update user error", error);
        throw error;
      }
    },
    [user]
  );

  // Role checking helpers
  const hasRole = useCallback(
    (targetRole) => role === targetRole,
    [role]
  );

  const hasAnyRole = useCallback(
    (roles) => Array.isArray(roles) && roles.includes(role),
    [role]
  );

  const value = useMemo(
    () => ({
      user,
      setUser, // note: does not persist; prefer updateUser for persistence
      loading,
      isAuthenticated,
      role,
      login,
      logout,
      refreshUser,
      updateUser,
      hasRole,
      hasAnyRole,
    }),
    [
      user,
      loading,
      isAuthenticated,
      role,
      login,
      logout,
      refreshUser,
      updateUser,
      hasRole,
      hasAnyRole,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook for using UserContext
export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
};
