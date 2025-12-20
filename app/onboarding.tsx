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
        setErrorMsg(t('onboarding.fill_required'));
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
    } else {
      // If we are on step 1, go back to auth
      router.replace("/auth");
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

      router.replace("/warning");
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
      <Text style={styles.stepTitle}>{t('onboarding.step1_title')}</Text>
      <Text style={[styles.stepSubtitle, { marginBottom: 16 }]}>{t('onboarding.step1_subtitle')}</Text>

      <View style={styles.inputContainer}>
        <User size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={t('onboarding.display_name')}
          placeholderTextColor={COLORS.textTertiary}
          value={data.displayName}
          onChangeText={(text) => setData({ ...data, displayName: text })}
        />
      </View>

      <Text style={[styles.stepSubtitle, { marginTop: 16, marginBottom: 12 }]}>{t('onboarding.username_question')}</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.prefixIcon}>@</Text>
        <TextInput
          style={[styles.input, { paddingLeft: 0 }]}
          placeholder={t('onboarding.username_placeholder')}
          placeholderTextColor={COLORS.textTertiary}
          value={data.username.startsWith('@') ? data.username.substring(1) : data.username}
          onChangeText={(text) => {
            const clean = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
            setData({ ...data, username: '@' + clean });
          }}
          autoCapitalize="none"
        />
      </View>
      <Text style={styles.helperText}>{t('onboarding.username_helper')}</Text>
    </View>
  );

  const renderStep2_Biometrics = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('onboarding.step2_title')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.step2_subtitle')}</Text>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('onboarding.age_label')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('onboarding.age_placeholder')}
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="numeric"
              value={data.biometrics.age?.toString() || ""}
              onChangeText={(text) => {
                const val = parseInt(text.replace(/[^0-9]/g, '')) || null;
                setData({ ...data, biometrics: { ...data.biometrics, age: val } });
              }}
              maxLength={3}
            />
          </View>
        </View>
        <View style={{ width: 16 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('onboarding.gender_label')}</Text>
          <View style={styles.genderToggle}>
            <TouchableOpacity
              style={[styles.genderBtn, data.biometrics.gender === 'male' && styles.genderBtnActive]}
              onPress={() => setData({ ...data, biometrics: { ...data.biometrics, gender: 'male' } })}
            >
              <Text style={[styles.genderText, data.biometrics.gender === 'male' && styles.genderTextActive]}>{t('onboarding.gender_male')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, data.biometrics.gender === 'female' && styles.genderBtnActive]}
              onPress={() => setData({ ...data, biometrics: { ...data.biometrics, gender: 'female' } })}
            >
              <Text style={[styles.genderText, data.biometrics.gender === 'female' && styles.genderTextActive]}>{t('onboarding.gender_female')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('onboarding.weight_placeholder')}</Text>
          <View style={[styles.inputContainer, { marginBottom: 0 }]}>
            <Weight size={18} color={COLORS.textTertiary} style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="numeric"
              value={data.biometrics.weight?.toString() || ""}
              onChangeText={(text) => {
                const val = parseInt(text.replace(/[^0-9]/g, '')) || null;
                setData({ ...data, biometrics: { ...data.biometrics, weight: val } });
              }}
              maxLength={3}
            />
            <Text style={{ color: COLORS.textTertiary, marginLeft: 4 }}>kg</Text>
          </View>
        </View>
        <View style={{ width: 16 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('onboarding.height_placeholder')}</Text>
          <View style={[styles.inputContainer, { marginBottom: 0 }]}>
            <Ruler size={18} color={COLORS.textTertiary} style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="numeric"
              value={data.biometrics.height?.toString() || ""}
              onChangeText={(text) => {
                const val = parseInt(text.replace(/[^0-9]/g, '')) || null;
                setData({ ...data, biometrics: { ...data.biometrics, height: val } });
              }}
              maxLength={3}
            />
            <Text style={{ color: COLORS.textTertiary, marginLeft: 4 }}>cm</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep3_Experience = () => {
    const levels: { id: ExperienceLevel; titleKey: string; descKey: string }[] = [
      { id: 'beginner', titleKey: 'onboarding.levels.beginner', descKey: 'onboarding.levels.beginner_desc' },
      { id: 'intermediate', titleKey: 'onboarding.levels.intermediate', descKey: 'onboarding.levels.intermediate_desc' },
      { id: 'advanced', titleKey: 'onboarding.levels.advanced', descKey: 'onboarding.levels.advanced_desc' },
    ];

    // 3, 4, 5, 6 days
    const dayOpts = [3, 4, 5, 6];

    return (
      <ScrollView style={styles.stepScroll} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>{t('onboarding.step3_title')}</Text>
        <Text style={styles.stepSubtitle}>{t('onboarding.step3_subtitle')}</Text>

        <Text style={styles.sectionLabel}>{t('onboarding.experience_question')}</Text>
        {levels.map((lvl) => (
          <TouchableOpacity
            key={lvl.id}
            style={[styles.card, data.experienceLevel === lvl.id && styles.cardActive]}
            onPress={() => setData({ ...data, experienceLevel: lvl.id })}
          >
            <View>
              <Text style={[styles.cardTitle, data.experienceLevel === lvl.id && styles.cardTitleActive]}>
                {t(lvl.titleKey)}
              </Text>
              <Text style={styles.cardDesc}>{t(lvl.descKey)}</Text>
            </View>
            {data.experienceLevel === lvl.id && <Check size={20} color={COLORS.textInverse} />}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('onboarding.days_question')}</Text>
        <View style={styles.daysGrid}>
          {dayOpts.map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.dayBtn, data.daysPerWeek === d && styles.dayBtnActive]}
              onPress={() => setData({ ...data, daysPerWeek: d })}
            >
              <Text style={[styles.dayText, data.daysPerWeek === d && styles.dayTextActive]}>{d}</Text>
              <Text style={[styles.dayLabel, data.daysPerWeek === d && styles.dayTextActive]}>{t('onboarding.days_label')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderStep4_Goals = () => {
    // Only these 3 options as per requested logic (max 2)
    const goals: { id: Goal; titleKey: string; icon: any }[] = [
      { id: 'strength', titleKey: 'onboarding.goals.strength', icon: Dumbbell },
      { id: 'hypertrophy', titleKey: 'onboarding.goals.hypertrophy', icon: Activity },
      { id: 'weight_loss', titleKey: 'onboarding.goals.weight_loss', icon: Target },
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
        <Text style={styles.stepTitle}>{t('onboarding.step4_title')}</Text>
        <Text style={styles.stepSubtitle}>{t('onboarding.step4_subtitle')}</Text>

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
                  {t(item.titleKey)}
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
    const injuries: { id: Injury; titleKey: string }[] = [
      { id: 'shoulders', titleKey: 'onboarding.injuries.shoulders' },
      { id: 'knees', titleKey: 'onboarding.injuries.knees' },
      { id: 'lower_back', titleKey: 'onboarding.injuries.lower_back' },
      { id: 'wrists', titleKey: 'onboarding.injuries.wrists' },
      { id: 'none', titleKey: 'onboarding.injuries.none' },
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
        <Text style={styles.stepTitle}>{t('onboarding.step5_title')}</Text>
        <Text style={styles.stepSubtitle}>{t('onboarding.step5_subtitle')}</Text>

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
                  {t(item.titleKey)}
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
    <View
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
        <Text style={styles.stepCounter}>{t('onboarding.step_counter', { current: currentStep, total: STEPS })}</Text>
      </View>

      {/* Content - Auto-scrolls when keyboard appears */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {currentStep === 1 && renderStep1_Identity()}
          {currentStep === 2 && renderStep2_Biometrics()}
          {currentStep === 3 && renderStep3_Experience()}
          {currentStep === 4 && renderStep4_Goals()}
          {currentStep === 5 && renderStep5_Safety()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.footerButtons}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={saving}>
            <ArrowLeft size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, saving && { opacity: 0.7 }]}
            onPress={handleNext}
            disabled={saving}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === STEPS ? (saving ? t('onboarding.saving') : t('onboarding.finish')) : t('onboarding.continue')}
            </Text>
            {!saving && currentStep !== STEPS && <ArrowRight size={20} color={COLORS.textInverse} />}
          </TouchableOpacity>
        </View>
      </View>


    </View>
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
    alignSelf: 'stretch',
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
