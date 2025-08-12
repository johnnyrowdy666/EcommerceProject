import React from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";

export default function SettingScreen({ navigation }) {
  const handleLogout = () => {
    Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบหรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ออกจากระบบ",
        style: "destructive",
        onPress: () => {
          // TODO: ล้าง token / state แล้ว redirect
          navigation.navigate("Home");
          Alert.alert("ออกจากระบบเรียบร้อย");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>การตั้งค่า</Text>
      <View style={{ marginTop: 16 }}>
        <Button title="ออกจากระบบ" onPress={handleLogout} color="#ff6f61" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "700" },
});
