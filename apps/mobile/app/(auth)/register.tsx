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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  // Java backend requires `username` (not first/last name) — concatenate locally for display.
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.email || !form.password) return;
    setLoading(true);
    try {
      const username =
        (form.firstName.trim() + ' ' + form.lastName.trim()).trim() ||
        form.email.split('@')[0];
      await register({
        email: form.email,
        password: form.password,
        username,
      });
      router.replace('/(auth)/profile-setup');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>NutriDz</Text>
        <Text style={styles.subtitle}>{t('auth.register')}</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t('auth.firstName')}
            placeholderTextColor={Colors.textMuted}
            value={form.firstName}
            onChangeText={(v) => setForm({ ...form, firstName: v })}
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.lastName')}
            placeholderTextColor={Colors.textMuted}
            value={form.lastName}
            onChangeText={(v) => setForm({ ...form, lastName: v })}
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            placeholderTextColor={Colors.textMuted}
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.password')}
            placeholderTextColor={Colors.textMuted}
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t('common.loading') : t('auth.register')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>
            {t('auth.hasAccount')}{' '}
            <Text style={styles.linkBold}>{t('auth.login')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Theme.spacing.xxl },
  title: {
    fontSize: 42,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(34,197,94,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: Theme.fontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xxxl,
    marginTop: Theme.spacing.sm,
  },
  form: { gap: Theme.spacing.md, marginBottom: Theme.spacing.xxl },
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
    marginBottom: Theme.spacing.xl,
    ...Theme.glow.subtle,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.semibold },
  link: { textAlign: 'center', color: Colors.textSecondary, fontSize: Theme.fontSize.sm },
  linkBold: { color: Colors.primary, fontWeight: Theme.fontWeight.semibold },
});
