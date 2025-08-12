import React, { useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet } from "react-native";

const MOCK = [
  { id: "1", name: "รองเท้าผ้าใบ" },
  { id: "2", name: "เสื้อยืด" },
  { id: "3", name: "กระเป๋า" },
  { id: "4", name: "นาฬิกา" },
];

export default function SearchScreen() {
  const [query, setQuery] = useState("");

  const filtered = MOCK.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="ค้นหาสินค้า..."
        value={query}
        onChangeText={setQuery}
        style={styles.searchInput}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.itemText}>{item.name}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>ไม่พบผลลัพธ์</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  searchInput: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  itemText: { fontSize: 16 },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
});
