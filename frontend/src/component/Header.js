import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";

// icons
import Ionicons from "react-native-vector-icons/Ionicons";
import Octicons from "react-native-vector-icons/Octicons";
import { iconSize } from "../constants/dimensions";
import { useNavigation } from "@react-navigation/native";

const Header = () => {
  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.goBack();
  };

  // ไม่มี toggleTheme แล้ว ดังนั้นปุ่มเปลี่ยนธีมจะไม่ทำงาน
  // หรือจะลบปุ่มนั้นทิ้งเลยก็ได้ ถ้าไม่ต้องการ

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleGoBack}>
        <Ionicons
          name={"arrow-back"}
          color={"#000000"} // สีดำคงที่
          size={iconSize.md}
        />
      </TouchableOpacity>

      {/* ลบปุ่มเปลี่ยนธีมออก ถ้าอยากเก็บไว้ แค่แสดง icon ธรรมดา */}
      {/* <TouchableOpacity>
        <Octicons
          name={"moon"}
          color={"#000000"}
          size={iconSize.md}
        />
      </TouchableOpacity> */}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10, // เพิ่ม padding เพื่อความสวยงาม
    alignItems: "center",
  },
});
