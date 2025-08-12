import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { fontFamily } from "../constants/fontFamily";
import { fontSize, iconSize, spacing } from "../constants/dimensions";

// icons
import Feather from "react-native-vector-icons/Feather";
import { ScrollView } from "react-native-gesture-handler";

const CustomInput = ({ label, icon, placeholder, type, ...rest }) => {
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.inputLabel, { color: "#000000" /* สีดำ */ }]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputFieldContainer,
          { borderColor: "#F1ECEC" /* สีขอบ */ },
        ]}
      >
        {icon && React.cloneElement(icon, { color: "#666666" /* สีไอคอน */ })}
        <TextInput
          style={[styles.textInput, { color: "#000000" /* สีข้อความ */ }]}
          placeholder={placeholder}
          placeholderTextColor={"#999999" /* สี placeholder */}
          secureTextEntry={type === "password" && secureTextEntry}
          {...rest}
        />
        {type === "password" && (
          <TouchableOpacity
            onPress={() => setSecureTextEntry(!secureTextEntry)}
          >
            <Feather
              name={secureTextEntry ? "eye" : "eye-off"}
              size={iconSize.md}
              color={"#666666"}
              style={styles.icon}
            />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

export default CustomInput;

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  inputLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    marginVertical: 12,
  },
  inputFieldContainer: {
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
  },
  icon: {
    marginHorizontal: spacing.sm,
  },
});
