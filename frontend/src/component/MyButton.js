import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const MyButton = ({title,onPress,backgroundColor="#0DC86B",color}) => {
  return ( 
    <TouchableOpacity style={[styles.button,{backgroundColor,color}]} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
      width: "100%",
      paddingVertical: 15,
      borderRadius: 25,
      marginTop: 20  ,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      
      
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    
  },
});

export default MyButton;
