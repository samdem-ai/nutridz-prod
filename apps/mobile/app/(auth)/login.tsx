import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>NutriDz</Text>
          <Text style={styles.subtitle}>Nutrition intelligente algerienne</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.password')}
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t('common.loading') : t('auth.login')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>
            {t('auth.noAccount')}{' '}
            <Text style={styles.linkBold}>{t('auth.register')}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xxxl + 16,
  },
  logo: {
    fontSize: 42,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.primary,
    textShadowColor: 'rgba(34,197,94,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.sm,
  },
  form: {
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xxl,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: Theme.spacing.lg,
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    ...Theme.glow.subtle,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
  },
  link: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.sm,
  },
  linkBold: {
    color: Colors.primary,
    fontWeight: Theme.fontWeight.semibold,
  },
});
