import React, { useState } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    try {
      const response = await axios.post('http://10.196.219.159:5000/login', {
        email,
        password,
      });

      const data = response.data;
      console.log('🧠 Backend response:', data);

      if (data.role === 'admin') {
        router.push('/screen/AdminDashboard');
      } else if (data.role === 'account_manager') {
        router.push('/screen/AccountManagerDashboard');
      } else if (data.role === 'content_creator') {
        router.push('/screen/ContentCreatorDashboard');
      } else {
        Alert.alert('Login Error', 'Unknown user role.');
      }

    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response) {
        Alert.alert('Login Failed', error.response.data.error || 'Invalid credentials or server error.');
      } else {
        Alert.alert('Login Failed', 'Unable to reach the server.');
      }
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Image
            source={require('../../assets/images/logo-transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>
            Welcome to <Text style={styles.brand}>Targetly</Text>
          </Text>

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#777"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#777"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log in</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/screen/SignupScreen')}>
            <Text style={styles.linkText}>Signup !</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 90,
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
  },
  logo: {
    width: 130,
    height: 130,
    alignSelf: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#777',
    marginBottom: 30,
  },
  brand: {
    fontWeight: 'bold',
    color: '#000',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4C7CFF',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    textDecorationLine: 'underline',
  },
});
