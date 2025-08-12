import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthCheck = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          await axios.get('http://10.0.2.2:5000/check-auth', {
            headers: { Authorization: `Bearer ${token}` }
          });
          navigation.navigate('Onboard');
        } catch (error) {
          AsyncStorage.removeItem('token');
          navigation.navigate('Login');
        }
      } else {
        navigation.navigate('Login');
      }
    };

    checkLoginStatus();
  }, []);

  return null;
};

export default AuthCheck;