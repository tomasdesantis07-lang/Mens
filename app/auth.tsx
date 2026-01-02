import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthTabs } from "../src/components/auth/AuthTabs";
import { CustomInput } from "../src/components/common/CustomInput";
import { PrimaryButton } from "../src/components/common/PrimaryButton";
import { AuthService } from "../src/services/authService";
import { COLORS } from "../src/theme/theme";

const AuthScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      if (mode === "register") {
        await AuthService.register(email.trim(), password);
        router.replace("/pre_onboarding");
      } else {
        await AuthService.login(email.trim(), password);
        router.replace("/(tabs)/home");
      }
    } catch (err: any) {
      console.log(err);
      setErrorMsg(AuthService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === "register";

  return (
    <View style={styles.screen}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
      />

      <View style={styles.card}>
        <AuthTabs mode={mode} setMode={setMode} />

        <Text style={styles.title}>
          {isRegister ? t('auth.create_title') : t('auth.login_title')}
        </Text>

        <CustomInput
          placeholder={t('auth.email_placeholder')}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordRow}>
          <CustomInput
            placeholder={t('auth.password_placeholder')}
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? (
              <EyeOff color={COLORS.textSecondary} size={20} />
            ) : (
              <Eye color={COLORS.textSecondary} size={20} />
            )}
          </TouchableOpacity>
        </View>

        {!isRegister && (
          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={() => {
              router.push("../forgot");
            }}
          >
            <Text style={styles.forgotText}>{t('auth.forgot_password')}</Text>
          </TouchableOpacity>
        )}

        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

        <PrimaryButton
          title={isRegister ? t('auth.create_action') : t('auth.login_action')}
          onPress={handleSubmit}
          loading={loading}
          disabled={!email || password.length < 6}
        />

        <TouchableOpacity
          onPress={() =>
            setMode((prev) => (prev === "login" ? "register" : "login"))
          }
          style={styles.switchModeContainer}
        >
          <Text style={styles.switchModeText}>
            {isRegister
              ? t('auth.switch_to_login')
              : t('auth.switch_to_register')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 96,
    height: 96,
    resizeMode: "contain",
    marginBottom: 16,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  passwordRow: {
    position: "relative",
    marginBottom: 12,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 40,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  forgotContainer: {
    alignItems: "flex-end",
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  error: {
    color: COLORS.error,
    marginBottom: 8,
    fontSize: 13,
  },
  switchModeContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  switchModeText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});