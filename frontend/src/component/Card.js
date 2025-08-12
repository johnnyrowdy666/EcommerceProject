import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

const Card = ({ title, content, image }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: image }} style={styles.image} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.content}>{content}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    container:{
        flex: 1,
        padding: 20,
        backgroundColor:'#959d90',   
        marginBottom:"10"     
    },
    card:{
        backgroundColor:"#fff",
        padding:10,
        marginBottom: 15,
        shadowColor:"#000",
        shadowOffset:{width:0,height:2},
        shadowOpacity:0.2,
        shadowRadius:4,
        elevation:3,
    },
    image:{
        width: "100%",
        height:400,
    },
    title:{
        fontSize: 18,
        fontWeight:"bold",
        marginBottom:5,
        padding:10

    },
    content:{
    fontSize:16,
    textAlign:"justify",
    marginLeft:"10",
    marginRight:"10",
    marginBottom:"10"



    }
});

export default Card;
