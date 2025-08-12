import React from "react";
import { View, StyleSheet } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import FontAwesome from '@expo/vector-icons/FontAwesome';

const Textbox = ({ placeholder, value, onChangeText }) => {
  return (
    <View style={styles.container}>
      
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', 
    alignItems: 'center', 
    margin: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    paddingHorizontal: 5, 
    marginBottom:10
  },
  icon: {
    marginRight: 8, 
  },
  input: {
    flex: 1, 
    fontSize: 16,
    paddingVertical: 10, 
  },
});

export default Textbox;