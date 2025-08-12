import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { iconSize } from "../constants/dimensions";

const DarkModeButton = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <TouchableOpacity
      onPress={toggleDarkMode}
      style={[
        styles.button,
        { backgroundColor: isDarkMode ? "rgba(255, 4, 4, 0.16)" : "rgba(255, 0, 0, 0.1)" }
      ]}
      activeOpacity={0.7}
    >
      <Icon
        name={isDarkMode ? "wb-sunny" : "brightness-3"}
        size={iconSize.md}
        color={isDarkMode ? "#FFD700" : "#333333"}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 9,
    right: 10,
  },
});

export default DarkModeButton;