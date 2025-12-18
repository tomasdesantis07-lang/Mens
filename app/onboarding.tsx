import { useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  Dumbbell,
  Ruler,
  ShieldAlert,
  Target,
  User,
  Weight
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from "react-native";
import { auth, db } from "../src/services/firebaseConfig";
import { RoutineService } from "../src/services/routineService";
import { COLORS, FONT_FAMILY, FONT_SIZE, LETTER_SPACING, TYPOGRAPHY } from "../src/theme/theme";
import { UserBiometrics } from "../src/types/user";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const STEPS = 5;
const SCREEN_WIDTH = Dimensions.get("window").width;

type Gender = 'male' | 'female';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
type Goal = 'strength' | 'hypertrophy' | 'weight_loss';
type Injury = 'shoulders' | 'knees' | 'lower_back' | 'wrists' | 'none';

interface OnboardingData {
  displayName: string;
  username: string; // @username
  biometrics: UserBiometrics;
  experienceLevel: ExperienceLevel | null;
  daysPerWeek: number | null;
  goals: Goal[];
  injuries: Injury[];
}

const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    displayName: "",
    username: "@",
    biometrics: { age: null, weight: null, height: null, gender: null },
    experienceLevel: null,
    daysPerWeek: null,
    goals: [],
    injuries: []
  });

  const [saving, setSaving] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Animations
  const progressAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const loadingMessages = [
    t('onboarding.loading.analyzing'),
    t('onboarding.loading.calculating'),
    t('onboarding.loading.structuring'),
    t('onboarding.loading.assigning'),
  ];

  // Cycle loading messages
  useEffect(() => {
    if (!saving) return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 800);
    return () => clearInterval(interval);
  }, [saving]);

  // Update progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Identity
        return data.displayName.trim().length > 0 &&
          /^@[a-z0-9_]{3,}$/.test(data.username);
      case 2: // Biometrics
        return !!data.biometrics.age &&
          !!data.biometrics.weight &&
          !!data.biometrics.height &&
          !!data.biometrics.gender;
      case 3: // Experience
        return !!data.experienceLevel && !!data.daysPerWeek;
      case 4: // Goals
        return data.goals.length > 0 && data.goals.length <= 2;
      case 5: // Safety
        return data.injuries.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS) {
      if (validateStep(currentStep)) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCurrentStep(prev => prev + 1);
        setErrorMsg("");
      } else {
        setErrorMsg(t('common.fill_required')); // Generic error, could be more specific
      }
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(prev => prev - 1);
      setErrorMsg("");
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    const startTime = Date.now();

    try {
      // Map to legacy format expected by RoutineService
      // onboarding goals: 'strength' | 'hypertrophy' | 'weight_loss'
      // RoutineService expects: 'muscle' | 'fat_loss' | 'strength'
      let primaryGoal: 'muscle' | 'fat_loss' | 'strength';
      if (data.goals[0] === 'weight_loss') {
        primaryGoal = 'fat_loss';
      } else if (data.goals[0] === 'hypertrophy') {
        primaryGoal = 'muscle';
      } else {
        primaryGoal = 'strength';
      }

      const levelKey = data.experienceLevel!; // Validated by step 3

      // Save User Profile
      await setDoc(doc(db, "users", user.uid), {
        displayName: data.displayName,
        username: data.username,
        biometrics: data.biometrics,
        experienceLevel: data.experienceLevel,
        daysPerWeek: data.daysPerWeek,
        goals: data.goals,
        injuries: data.injuries,
        // Legacy fields
        objective: primaryGoal,
        level: levelKey,
      }, { merge: true });

      // Create Routine
      await RoutineService.createAndAssignStarterRoutine(
        user.uid,
        data.daysPerWeek!,
        primaryGoal,
        levelKey
      );

      // Artificial Delay for UX
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 2500 - elapsed);
      if (remainingTime > 0) await new Promise(r => setTimeout(r, remainingTime));

      router.replace("/(tabs)/home");
    } catch (err) {
      console.error(err);
      setErrorMsg("Error saving profile. Please try again.");
      setSaving(false);
    }
  };

  // --- Render Helpers ---

  const renderStep1_Identity = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.appTitle}>MENS</Text>
      <Text style={styles.stepTitle}>{t('onboarding.step1_title') || "Identity"}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.step1_subtitle') || "How should we call you?"}</Text>

      <View style={styles.inputContainer}>
        <User size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Display Name"
          placeholderTextColor={COLORS.textTertiary}
          value={data.displayName}
          onChangeText={(text) => setData({ ...data, displayName: text })}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.prefixIcon}>@</Text>
        <TextInput
          style={[styles.input, { paddingLeft: 0 }]} // Adjust for prefix
          placeholder="username"
          placeholderTextColor={COLORS.textTertiary}
          value={data.username.startsWith('@') ? data.username.substring(1) : data.username}
          onChangeText={(text) => {
            const clean = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
            setData({ ...data, username: '@' + clean });
          }}
          autoCapitalize="none"
        />
      </View>
      <Text style={styles.helperText}>Only lowercase letters, numbers, and underscores.</Text>
    </View>
  );

  const renderStep2_Biometrics = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('onboarding.step2_title') || "Biometrics"}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.step2_subtitle') || "Customize your training loads."}</Text>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Years"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="numeric"
            value={data.biometrics.age?.toString() || ''}
            onChangeText={(t) => setData({ ...data, biometrics: { ...data.biometrics, age: parseInt(t) || null } })}
          />
        </View>
        <View style={{ width: 16 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderToggle}>
            <TouchableOpacity
              style={[styles.genderBtn, data.biometrics.gender === 'male' && styles.genderBtnActive]}
              onPress={() => setData({ ...data, biometrics: { ...data.biometrics, gender: 'male' } })}
            >
              <Text style={[styles.genderText, data.biometrics.gender === 'male' && styles.genderTextActive]}>M</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, data.biometrics.gender === 'female' && styles.genderBtnActive]}
              onPress={() => setData({ ...data, biometrics: { ...data.biometrics, gender: 'female' } })}
            >
              <Text style={[styles.genderText, data.biometrics.gender === 'female' && styles.genderTextActive]}>F</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Weight size={18} color={COLORS.textTertiary} style={styles.fieldIcon} />
          <TextInput
            style={styles.input}
            placeholder="Weight (kg)"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="numeric"
            value={data.biometrics.weight?.toString() || ''}
            onChangeText={(t) => setData({ ...data, biometrics: { ...data.biometrics, weight: parseFloat(t) || null } })}
          />
        </View>
        <View style={{ width: 16 }} />
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Ruler size={18} color={COLORS.textTertiary} style={styles.fieldIcon} />
          <TextInput
            style={styles.input}
            placeholder="Height (cm)"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="numeric"
            value={data.biometrics.height?.toString() || ''}
            onChangeText={(t) => setData({ ...data, biometrics: { ...data.biometrics, height: parseInt(t) || null } })}
          />
        </View>
      </View>
    </View>
  );

  const renderStep3_Experience = () => {
    const levels: { id: ExperienceLevel; title: string; desc: string }[] = [
      { id: 'beginner', title: "Recién empiezo", desc: "0-6 months" },
      { id: 'intermediate', title: "Intermedio", desc: "6 months - 2 years" },
      { id: 'advanced', title: "Avanzado", desc: "+2 years" },
    ];

    // 3, 4, 5, 6 days
    const dayOpts = [3, 4, 5, 6];

    return (
      <ScrollView style={styles.stepScroll} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Experience</Text>
        <Text style={styles.stepSubtitle}>Define your starting point.</Text>

        <Text style={styles.sectionLabel}>How long have you been training?</Text>
        {levels.map((lvl) => (
          <TouchableOpacity
            key={lvl.id}
            style={[styles.card, data.experienceLevel === lvl.id && styles.cardActive]}
            onPress={() => setData({ ...data, experienceLevel: lvl.id })}
          >
            <View>
              <Text style={[styles.cardTitle, data.experienceLevel === lvl.id && styles.cardTitleActive]}>
                {lvl.title}
              </Text>
              <Text style={styles.cardDesc}>{lvl.desc}</Text>
            </View>
            {data.experienceLevel === lvl.id && <Check size={20} color={COLORS.textInverse} />}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Weekly Training Days</Text>
        <View style={styles.daysGrid}>
          {dayOpts.map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.dayBtn, data.daysPerWeek === d && styles.dayBtnActive]}
              onPress={() => setData({ ...data, daysPerWeek: d })}
            >
              <Text style={[styles.dayText, data.daysPerWeek === d && styles.dayTextActive]}>{d}</Text>
              <Text style={[styles.dayLabel, data.daysPerWeek === d && styles.dayTextActive]}>Days</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderStep4_Goals = () => {
    // Only these 3 options as per requested logic (max 2)
    const goals: { id: Goal; title: string; icon: any }[] = [
      { id: 'strength', title: "Strength", icon: Dumbbell },
      { id: 'hypertrophy', title: "Hypertrophy", icon: Activity }, // Using Activity as placeholder for Muscle
      { id: 'weight_loss', title: "Weight Loss", icon: Target },
    ];

    const toggleGoal = (id: Goal) => {
      let newGoals = [...data.goals];
      if (newGoals.includes(id)) {
        newGoals = newGoals.filter(g => g !== id);
      } else {
        if (newGoals.length >= 2) {
          newGoals.shift(); // Remove first to keep max 2
        }
        newGoals.push(id);
      }
      setData({ ...data, goals: newGoals });
    };

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Goals</Text>
        <Text style={styles.stepSubtitle}>Select up to 2 priorities.</Text>

        {goals.map((item) => {
          const isSelected = data.goals.includes(item.id);
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, isSelected && styles.cardActive]}
              onPress={() => toggleGoal(item.id)}
            >
              <View style={styles.cardHeader}>
                <Icon size={24} color={isSelected ? COLORS.textInverse : COLORS.primary} />
                <Text style={[styles.cardTitle, { marginBottom: 0 }, isSelected && styles.cardTitleActive]}>
                  {item.title}
                </Text>
              </View>
              {isSelected && <Check size={20} color={COLORS.textInverse} />}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderStep5_Safety = () => {
    const injuries: { id: Injury; title: string }[] = [
      { id: 'shoulders', title: "Shoulders" },
      { id: 'knees', title: "Knees" },
      { id: 'lower_back', title: "Lower Back" },
      { id: 'wrists', title: "Wrists" },
      { id: 'none', title: "No Injuries" },
    ];

    const toggleInjury = (id: Injury) => {
      let newInjuries = [...data.injuries];
      if (id === 'none') {
        newInjuries = ['none'];
      } else {
        // Remove 'none' if selecting a real injury
        newInjuries = newInjuries.filter(i => i !== 'none');

        if (newInjuries.includes(id)) {
          newInjuries = newInjuries.filter(i => i !== id);
        } else {
          newInjuries.push(id);
        }
      }
      setData({ ...data, injuries: newInjuries });
    };

    return (
      <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Safety Protocol</Text>
        <Text style={styles.stepSubtitle}>Do you have any accumulated fatigue or injuries?</Text>

        {injuries.map((item) => {
          const isSelected = data.injuries.includes(item.id);
          const isNone = item.id === 'none';
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.card,
                styles.smallCard,
                isSelected && (isNone ? styles.cardSuccess : styles.cardWarning)
              ]}
              onPress={() => toggleInjury(item.id)}
            >
              <View style={styles.cardHeader}>
                {isSelected && !isNone && <ShieldAlert size={20} color={COLORS.background} />}
                <Text style={[
                  styles.cardTitle,
                  { marginBottom: 0 },
                  isSelected && { color: isNone ? COLORS.textInverse : COLORS.background }
                ]}>
                  {item.title}
                </Text>
              </View>
              {isSelected && <Check size={20} color={isNone ? COLORS.textInverse : COLORS.background} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Header Progress */}
      <View style={styles.header}>
        <Animated.View style={[styles.progressBarBG]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, STEPS],
                  outputRange: ["0%", "100%"]
                })
              }
            ]}
          />
        </Animated.View>
        <Text style={styles.stepCounter}>Step {currentStep} of {STEPS}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {currentStep === 1 && renderStep1_Identity()}
        {currentStep === 2 && renderStep2_Biometrics()}
        {currentStep === 3 && renderStep3_Experience()}
        {currentStep === 4 && renderStep4_Goals()}
        {currentStep === 5 && renderStep5_Safety()}
      </View>

      {/* Footer Actions */}
      <View style={styles.footer}>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.footerButtons}>
          {currentStep > 1 ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={saving}>
              <ArrowLeft size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : <View style={{ width: 50 }} />}

          <TouchableOpacity
            style={[styles.nextButton, saving && { opacity: 0.7 }]}
            onPress={handleNext}
            disabled={saving}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === STEPS ? (saving ? "Saving..." : "Finish") : "Continue"}
            </Text>
            {!saving && currentStep !== STEPS && <ArrowRight size={20} color={COLORS.textInverse} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Overlay */}
      {saving && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{loadingMessages[loadingMessageIndex]}</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  progressBarBG: {
    height: 4,
    backgroundColor: COLORS.card, // Darker track
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  stepCounter: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center', // Centered vertically for some steps
  },
  stepScroll: {
    flex: 1,
  },
  appTitle: {
    ...TYPOGRAPHY.display,
    fontSize: 48,
    letterSpacing: LETTER_SPACING.widest,
    color: COLORS.primary,
    marginBottom: 16,
  },
  stepTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  stepSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  // Inputs
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 56,
    color: COLORS.textPrimary,
    ...TYPOGRAPHY.body,
    fontSize: FONT_SIZE.lg,
    fontFamily: FONT_FAMILY.regular,
  },
  inputIcon: {
    marginRight: 12,
  },
  fieldIcon: {
    marginRight: 8,
  },
  prefixIcon: {
    color: COLORS.textTertiary,
    fontSize: 16,
    fontFamily: FONT_FAMILY.regular,
    marginRight: 4,
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: -8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  // Gender Toggle
  genderToggle: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
  },
  genderBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  genderBtnActive: {
    backgroundColor: COLORS.cardAlt, // Subtly lighter
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  genderText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textTertiary,
  },
  genderTextActive: {
    color: COLORS.primary,
  },
  // Cards
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smallCard: {
    paddingVertical: 16,
  },
  cardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10', // 10% opacity
  },
  cardSuccess: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success, // Solid for success? Or tint? Let's go solid for prominent 'None'
  },
  cardWarning: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warning,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardTitleActive: {
    color: COLORS.primary,
  },
  cardDesc: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  // Days Grid
  sectionLabel: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  dayBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  dayText: {
    ...TYPOGRAPHY.h3,
    fontSize: FONT_SIZE.xl + 2,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  dayLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  dayTextActive: {
    color: COLORS.textInverse,
  },
  // Footer
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: COLORS.card,
  },
  nextButton: {
    flex: 1,
    marginLeft: 16,
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textInverse,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background + 'EE', // High opacity
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    ...TYPOGRAPHY.button,
    marginTop: 20,
    color: COLORS.textPrimary,
  },
});
