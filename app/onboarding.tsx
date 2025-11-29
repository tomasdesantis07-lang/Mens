import { useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../src/services/firebaseConfig";
import { COLORS, COMPONENTS } from "../src/theme/theme";

const objectives = [
  "Ganar músculo",
  "Perder grasa",
  "Fuerza / rendimiento",
  "Salud general",
];

const daysOptions = [2, 3, 4, 5, 6];

const levels = ["Principiante", "Intermedio", "Avanzado"];

const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const [objective, setObjective] = useState<string | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async () => {
    if (!objective || !daysPerWeek || !level) return;

    const user = auth.currentUser;
    if (!user) {
      setErrorMsg("Sesión no válida. Volvé a iniciar sesión.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const ref = doc(db, "users", user.uid);
      await setDoc(
        ref,
        {
          objective,
          daysPerWeek,
          level,
          displayName: displayName.trim(),
        },
        { merge: true }
      );

      router.replace("/(tabs)/home");
    } catch (err) {
      console.log(err);
      setErrorMsg("No se pudo guardar la encuesta. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const canContinue =
    !!objective && !!daysPerWeek && !!level && displayName.trim().length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Configurar tu entrenamiento</Text>

      <Text style={styles.subtitle}>
        Esto nos ayuda a adaptar mejor tu experiencia en MENS.
      </Text>

      {/* NOMBRE */}
      <Text style={styles.sectionTitle}>¿Cómo querés que te llamemos?</Text>
      <TextInput
        style={styles.nameInput}
        placeholder="Ej: Juan"
        placeholderTextColor={COMPONENTS.input.placeholder}
        value={displayName}
        onChangeText={setDisplayName}
      />

      {/* OBJETIVO */}
      <Text style={styles.sectionTitle}>
        1. ¿Cuál es tu objetivo principal?
      </Text>

      <View style={styles.chipGroup}>
        {objectives.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.chip,
              objective === opt && styles.chipSelected,
            ]}
            onPress={() => setObjective(opt)}
          >
            <Text
              style={[
                styles.chipText,
                objective === opt && styles.chipTextSelected,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* DÍAS */}
      <Text style={styles.sectionTitle}>
        2. ¿Cuántos días por semana podés entrenar?
      </Text>

      <View style={styles.chipGroup}>
        {daysOptions.map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.chip,
              daysPerWeek === d && styles.chipSelected,
            ]}
            onPress={() => setDaysPerWeek(d)}
          >
            <Text
              style={[
                styles.chipText,
                daysPerWeek === d && styles.chipTextSelected,
              ]}
            >
              {d} días
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* NIVEL */}
      <Text style={styles.sectionTitle}>3. ¿Cuál es tu nivel actual?</Text>

      <View style={styles.chipGroup}>
        {levels.map((lv) => (
          <TouchableOpacity
            key={lv}
            style={[
              styles.chip,
              level === lv && styles.chipSelected,
            ]}
            onPress={() => setLevel(lv)}
          >
            <Text
              style={[
                styles.chipText,
                level === lv && styles.chipTextSelected,
              ]}
            >
              {lv}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

      {/* BOTÓN */}
      <TouchableOpacity
        style={[
          styles.button,
          !canContinue && { opacity: 0.4 },
        ]}
        disabled={!canContinue || saving}
        onPress={handleSave}
      >
        <Text style={styles.buttonText}>
          {saving ? "Guardando..." : "Continuar"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },

  chipGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  } as any,

  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: COLORS.card,
  },

  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  chipTextSelected: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: "600",
  },

  button: {
    marginTop: 32,
    backgroundColor: COMPONENTS.button.solid.background,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },

  buttonText: {
    color: COMPONENTS.button.solid.text,
    fontSize: 16,
    fontWeight: "600",
  },

  error: {
    color: COLORS.accent,
    marginTop: 12,
  },

  nameInput: {
    backgroundColor: COMPONENTS.input.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COMPONENTS.input.border,
  },
});
