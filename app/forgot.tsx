import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { MensLogo } from "../src/components/common/BrandIcons";
import { auth } from "../src/services/firebaseConfig";
import { COLORS, COMPONENTS } from "../src/theme/theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "Listo",
        "Te enviamos un link para restablecer tu contraseña."
      );
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Error",
        "No se pudo enviar el email. Verificá que sea un correo válido."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Flecha back */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={{ color: COLORS.textPrimary, fontSize: 20 }}>←</Text>
      </TouchableOpacity>

      {/* Logo */}
      <MensLogo
        size={80}
        style={styles.logo}
      />

      <Text style={styles.title}>Recuperar contraseña</Text>

      <Text style={styles.subtitle}>
        Te enviaremos un correo con un link para restablecer tu contraseña.
      </Text>

      <View style={styles.card}>
        <TextInput
          placeholder="Correo"
          placeholderTextColor={COMPONENTS.input.placeholder}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity
          style={[
            styles.button,
            (!email.trim() || loading) && { opacity: 0.5 },
          ]}
          disabled={!email || loading}
          onPress={handleReset}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textInverse} />
          ) : (
            <Text style={styles.buttonText}>Enviar link</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  backButton: {
    marginBottom: 20,
  },

  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 16,
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 10,
  },

  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  input: {
    backgroundColor: COMPONENTS.input.background,
    borderColor: COMPONENTS.input.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },

  button: {
    backgroundColor: COMPONENTS.button.solid.background,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },

  buttonText: {
    color: COMPONENTS.button.solid.text,
    fontSize: 15,
    fontWeight: "600",
  },
});
