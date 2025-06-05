import Constants from 'expo-constants';
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

// API_BASE_URL'yi alırken null/undefined durumlarını kontrol et ve bir varsayılan değer ata
// Eğer app.json'da veya ortamda hiçbir şey tanımlı değilse, boş bir string veya bir hata fırlatabilirsiniz.
// Şimdilik, eğer bulunamazsa konsola bir uyarı yazıp boş string kullanalım.
const getApiBaseUrl = (): string => {
  const apiUrlFromConfig = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof apiUrlFromConfig === 'string' && apiUrlFromConfig) {
    return apiUrlFromConfig;
  }
  // Geliştirme sırasında bir varsayılan URL veya bir uyarı/hata faydalı olabilir
  console.warn(
    "API_BASE_URL bulunamadı app.json'daki 'extra' bölümünde veya tanımsız. Lütfen kontrol edin."
  );
  // Çalışmaya devam etmesi için geçici bir varsayılan veya uygulamanın davranması gereken bir şey
  return 'http://YOUR_FALLBACK_OR_ERROR_URL'; // VEYA throw new Error("API_BASE_URL is not defined");
};

const API_BASE_URL = getApiBaseUrl();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // Test amaçlı API_BASE_URL'yi component ilk render olduğunda loglayabiliriz
  React.useEffect(() => {
    console.log('Kullanılan API_BASE_URL:', API_BASE_URL);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    if (!API_BASE_URL || API_BASE_URL === 'http://YOUR_FALLBACK_OR_ERROR_URL') {
        Alert.alert('Configuration Error', 'API base URL is not configured correctly.');
        return;
    }

    try {
      // API_BASE_URL'yi burada kullanıyoruz
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
      });

      const data = response.data;
      console.log('🧠 Backend response:', data);

      switch (data.role) { // data.role kontrolünü switch ile yapmak daha okunur olabilir
        case 'admin':
          router.push('/screen/AdminDashboard');
          break;
        case 'account_manager':
          router.push('/screen/AccountManagerDashboard');
          break;
        case 'content_creator':
          router.push('/screen/ContentCreatorDashboard');
          break;
        default:
          Alert.alert('Login Error', data.message || 'Unknown user role or login issue.');
      }

    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response) {
        // Backend'den gelen hata mesajını göstermeye çalışalım
        const errorMessage = error.response.data?.error || error.response.data?.message || 'Invalid credentials or server error.';
        Alert.alert('Login Failed', errorMessage);
      } else if (error.request) {
        // İstek yapıldı ama cevap alınamadı (örneğin, ağ hatası, sunucu kapalı)
        Alert.alert('Login Failed', 'Unable to reach the server. Please check your network connection.');
      } else {
        // İsteği ayarlarken bir şeyler ters gitti
        Alert.alert('Login Failed', 'An unexpected error occurred during login.');
      }
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
            // onSubmitEditing={() => passwordInputRef.current?.focus()} // Şifre inputuna odaklanmak için bir ref gerekebilir
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            // ref={passwordInputRef} // Eğer yukarıdaki onSubmitEditing'i kullanacaksanız
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#777"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="done"
            onSubmitEditing={handleLogin} // Şifreyi girdikten sonra Enter'a basınca login denesin
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log in</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { /* Şifremi unuttum fonksiyonu eklenecek */ }}>
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
    paddingTop: 90, // Adjust as needed, or use SafeAreaView for more robust spacing
    justifyContent: 'flex-start', // Veya 'center' eğer ortalamak isterseniz
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
    backgroundColor: '#f0f0f0', // Biraz daha açık bir renk denemesi
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16, // paddingHorizontal ekledim
    fontSize: 16,
    marginBottom: 10,
    color: '#333', // Yazı rengi
  },
  button: {
    backgroundColor: '#4C7CFF',
    paddingVertical: 15, // paddingVertical ekledim
    borderRadius: 12,
    marginTop: 20, // Biraz daha boşluk
    alignItems: 'center', // Buton içindeki yazıyı ortalamak için
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
    marginTop: 15, // Biraz daha boşluk
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});