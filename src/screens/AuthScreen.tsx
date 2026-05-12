import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography, rounded, componentStyles } from '../theme';
import Chevron from '../components/Chevron';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'>;
};

export default function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signIn, signUp, loading } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimEmail = email.trim().toLowerCase();
    const trimPass = password.trim();

    if (!trimEmail || !trimPass) {
      Alert.alert('Campos vacíos', 'Ingresa tu correo y contraseña.');
      return;
    }
    if (trimPass.length < 6) {
      Alert.alert('Contraseña corta', 'Mínimo 6 caracteres.');
      return;
    }

    setSubmitting(true);
    let err: string | null;

    if (mode === 'login') {
      err = await signIn(trimEmail, trimPass);
      if (!err) {
        navigation.replace('Home');
      } else {
        Alert.alert('Error al iniciar sesión', err);
      }
    } else {
      err = await signUp(trimEmail, trimPass);
      if (!err) {
        Alert.alert(
          '¡Cuenta creada!',
          'Revisa tu correo para confirmar la cuenta y luego inicia sesión.',
          [{ text: 'OK', onPress: () => setMode('login') }]
        );
      } else {
        Alert.alert('Error al registrarse', err);
      }
    }
    setSubmitting(false);
  };

  const handleGuest = () => {
    navigation.replace('Home');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.ink} />

      {/* Utility strip */}
      <View style={componentStyles.utilityStrip}>
        <Text style={styles.utilityText}>Tower Defense · Cuenta</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero banner */}
        <View style={styles.heroWrap}>
          <Chevron side="left" height={160} width={28} />
          <Chevron side="right" height={160} width={28} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              {mode === 'login' ? 'Bienvenido\nde vuelta' : 'Crear\ncuenta'}
            </Text>
            <View style={styles.heroDivider} />
            <Text style={styles.heroSub}>
              {mode === 'login'
                ? 'Tu progreso se carga desde la nube.'
                : 'Guarda tu progreso en todos tus dispositivos.'}
            </Text>
          </View>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          {/* Tab toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleTab, mode === 'login' && styles.toggleTabActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                Iniciar sesión
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleTab, mode === 'register' && styles.toggleTabActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>
                Registrarse
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={colors.steel}
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.steel}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[componentStyles.btnPrimary, styles.submitBtn]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[componentStyles.btnLabel, styles.submitBtnText]}>
                {mode === 'login' ? '→  Entrar' : '→  Crear cuenta'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Guest divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Guest button */}
        <TouchableOpacity
          style={[componentStyles.btnOutlineInk, styles.guestBtn]}
          onPress={handleGuest}
          activeOpacity={0.8}
        >
          <Text style={componentStyles.btnLabelOutlineInk}>
            🎮  Jugar sin cuenta
          </Text>
        </TouchableOpacity>

        <Text style={styles.guestNote}>
          Sin cuenta, tu progreso solo se guarda localmente.
        </Text>

        {/* Ink slab info */}
        <View style={styles.inkSlab}>
          <Text style={styles.inkSlabTitle}>¿Por qué crear cuenta?</Text>
          <Text style={styles.inkSlabBody}>
            • Tu progreso, monedas y tropas se guardan en la nube{'\n'}
            • Accede desde cualquier dispositivo{'\n'}
            • Nunca pierdas tu partida
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  utilityText: { ...typography.captionMd, color: colors.onInk },
  scroll: {
    paddingBottom: 40,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },

  // Hero
  heroWrap: {
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  heroContent: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    zIndex: 1,
  },
  heroTitle: {
    ...typography.displayLg,
    color: colors.ink,
    lineHeight: 42,
  },
  heroDivider: {
    width: 40,
    height: 3,
    backgroundColor: colors.primary,
    marginVertical: spacing.sm,
  },
  heroSub: { ...typography.bodyMd, color: colors.charcoal },

  // Form
  formCard: {
    marginHorizontal: spacing.xxl,
    marginTop: spacing.xxl,
    backgroundColor: colors.canvas,
    borderRadius: rounded.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.xl,
    gap: spacing.md,
  },

  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.cloud,
    borderRadius: rounded.md,
    padding: 4,
    marginBottom: spacing.xs,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: rounded.sm,
  },
  toggleTabActive: {
    backgroundColor: colors.canvas,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  toggleText: { ...typography.captionBold, color: colors.graphite },
  toggleTextActive: { color: colors.ink },

  fieldGroup: { gap: spacing.xxs },
  fieldLabel: { ...typography.captionBold, color: colors.charcoal },
  input: {
    height: 48,
    backgroundColor: colors.cloud,
    borderRadius: rounded.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.md,
    ...typography.bodyMd,
    color: colors.ink,
  },

  submitBtn: { marginTop: spacing.xs },
  submitBtnText: { color: colors.onPrimary },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xxl,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.hairline },
  dividerText: { ...typography.captionMd, color: colors.steel },

  // Guest
  guestBtn: { marginHorizontal: spacing.xxl, marginTop: spacing.md },
  guestNote: {
    ...typography.captionSm,
    color: colors.steel,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginHorizontal: spacing.xxl,
  },

  // Ink slab
  inkSlab: {
    marginTop: spacing.xxl,
    backgroundColor: colors.ink,
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  inkSlabTitle: { ...typography.displayXs, color: colors.onInk },
  inkSlabBody: { ...typography.bodyMd, color: colors.steel, lineHeight: 22 },
});
