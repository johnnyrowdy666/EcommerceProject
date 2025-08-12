import React from "react";
import { View, Text, StyleSheet } from "react-native";

const Msgbox = ({ title, content }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.content}>{content}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor:"white",
    padding:20,
    borderRadius:10,
    margin:10,
    shadowColor:"#000",
    shadowOffset:{width:0,height:2},
    shadowOpacity:0.2,
    shadowRadius:4,
    elevation:2
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',  
    marginBottom: 10,
  },
  content: {
    fontSize: 16,
    color: '#555',
  },
});

export default Msgbox;
