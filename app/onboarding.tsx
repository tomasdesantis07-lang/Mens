import { useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Dumbbell,
  Eye,
  Globe,
  Instagram,
  Play,
  Ruler,
  Search,
  Share2,
  ShieldAlert,
  Target,
  User,
  Users,
  Weight,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { COUNTRIES, Country } from "../src/data/countries";
import { AuthService } from "../src/services/authService";
import { auth, db } from "../src/services/firebaseConfig";
import { RoutineService } from "../src/services/routineService";
import { WorkoutService } from "../src/services/workoutService";
import { COLORS, FONT_FAMILY, FONT_SIZE, LETTER_SPACING, TYPOGRAPHY } from "../src/theme/theme";
import { AcquisitionSource, Equipment, ExperienceLevel, PosturalProblem, UserBiometrics, UserGoal } from "../src/types/user";
import { calculateAge, calculateBMI, calculateBMR, calculateTDEE, getWeightClass } from "../src/utils/healthUtils";

const STEPS = 8;
const SCREEN_WIDTH = Dimensions.get("window").width;

interface OnboardingData {
  displayName: string;
  username: string; // @username
  biometrics: UserBiometrics;
  experienceLevel: ExperienceLevel | null;
  daysPerWeek: number | null;
  goals: UserGoal[];
  equipment: Equipment | null;
  injuries: ('shoulders' | 'knees' | 'lower_back' | 'wrists' | 'none')[];
  posturalProblems: PosturalProblem[];
  acquisitionSource: AcquisitionSource;
  country: Country | null;
  healthCompleted: boolean; // Flag for expert branch
}

const AnimatedNumber = ({ value, duration = 1500 }: { value: number, duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    // Simple linear interpolation
    const startTime = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      const current = Math.round(start + (end - start) * ease);
      setDisplayValue(current);

      if (progress >= 1) clearInterval(timer);
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  // Use tabular nums font variant for stable width during animation
  return (
    <Text style={[styles.metricValue, { fontVariant: ['tabular-nums'] }]}>
      {displayValue.toLocaleString()}
    </Text>
  );
};

const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [showExpertDecision, setShowExpertDecision] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    displayName: "",
    username: "@",
    biometrics: { birthDate: null, weight: null, height: null, gender: null },
    experienceLevel: null,
    daysPerWeek: null,
    goals: [],
    equipment: null,
    injuries: [],
    posturalProblems: [],
    acquisitionSource: null,
    country: null,
    healthCompleted: true
  });

  const [saving, setSaving] = useState(false);

  // Country Modal
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const usernameCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);


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

  // Generate username suggestions
  const generateSuggestions = (base: string): string[] => {
    const clean = base.replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
    if (clean.length < 2) return [];

    const suggestions: string[] = [];
    const suffixes = [
      `${Math.floor(Math.random() * 100)}`,
      `_${Math.floor(Math.random() * 100)}`,
      `${Math.floor(Math.random() * 10)}`,
      `_`,
      `${Math.floor(Math.random() * 1000)}`,
    ];

    // Generate 3 unique suggestions
    const usedSuffixes = new Set<string>();
    while (suggestions.length < 3 && usedSuffixes.size < suffixes.length) {
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      if (!usedSuffixes.has(suffix)) {
        usedSuffixes.add(suffix);
        const suggestion = `@${clean}${suffix}`.slice(0, 20); // Max 20 chars
        if (!suggestions.includes(suggestion)) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions;
  };

  // Check username availability with debounce
  useEffect(() => {
    const username = data.username;

    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    // Reset if username too short
    if (!username || username.length < 4) { // @ + 3 chars minimum
      setUsernameStatus('idle');
      setUsernameSuggestions([]);
      return;
    }

    setUsernameStatus('checking');

    // Debounce the check
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const isAvailable = await AuthService.checkUsernameAvailable(username);
        if (isAvailable) {
          setUsernameStatus('available');
          setUsernameSuggestions([]);
        } else {
          setUsernameStatus('taken');
          setUsernameSuggestions(generateSuggestions(username));
        }
      } catch (error: any) {
        console.error('Error checking username:', error);
        // If permission denied, assume available (will validate on save if needed)
        if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
          setUsernameStatus('available');
        } else {
          setUsernameStatus('idle');
        }
      }
    }, 500);

    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [data.username]);

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
          /^@[a-z0-9_]{3,}$/.test(data.username) &&
          usernameStatus === 'available';
      case 2: // Biometrics
        return !!data.biometrics.birthDate &&
          data.biometrics.birthDate.length === 14 && // Complete date: "YYYY / MM / DD"
          !!data.biometrics.weight &&
          !!data.biometrics.height &&
          !!data.biometrics.gender;
      case 3: // Experience
        return !!data.experienceLevel;
      case 4: // Goals
        return data.goals.length > 0;
      case 5: // Equipment
        return !!data.equipment;
      case 6: // Frequency
        return !!data.daysPerWeek;
      case 7: // Safety Protocol (Injuries + Postural Problems)
        return data.injuries.length > 0;
      case 8: // Acquisition
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (showExpertDecision) {
      // Logic handled in buttons
      return;
    }

    if (currentStep < STEPS) {
      if (validateStep(currentStep)) {
        // Special Logic: Expert Branch
        // Trigger after Frequency (Step 6) and before Injuries (Step 7)
        if (currentStep === 6) {
          const isExpert = data.experienceLevel === 'advanced' || data.experienceLevel === 'expert';
          if (isExpert) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setShowExpertDecision(true);
            return;
          }
        }

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCurrentStep(prev => prev + 1);
        setErrorMsg("");
      } else {
        setErrorMsg(t('onboarding.fill_required'));
      }
    } else {
      // Finished all steps
      setShowResults(true);
    }
  };

  const handleExpertDecision = (choice: 'complete' | 'direct') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (choice === 'complete') {
      // Continue to Step 7 (Injuries)
      setShowExpertDecision(false);
      setCurrentStep(7);
      setData({ ...data, healthCompleted: true });
    } else {
      // Skip to Step 8 (Acquisition), set flag false
      setShowExpertDecision(false);
      setCurrentStep(8);
      setData({ ...data, healthCompleted: false });
    }
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
      return;
    }
    if (showExpertDecision) {
      setShowExpertDecision(false);
      // Do not change step, just hide overlay to return to Step 6 view if needed,
      // or effectively we are still "at" the end of step 6.
      return;
    }
    if (currentStep > 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      // If back from Step 8 and we skipped health, we should go back to Step 6?
      // Or allow reviewing Step 7?
      // Let's standard back behavior. If we skipped 7, current is 8.
      // If we skipped 7: 8 -> 6.
      if (currentStep === 8 && !data.healthCompleted && (data.experienceLevel === 'advanced' || data.experienceLevel === 'expert')) {
        setCurrentStep(6);
      } else {
        setCurrentStep(prev => prev - 1);
      }
      setErrorMsg("");
    } else {
      // If we are on step 1, go back to auth
      router.replace("/auth");
    }
  };

  const getLegacyMapping = () => {
    // Map ExperienceLevel to 'beginner' | 'intermediate' | 'advanced'
    let level: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    if (data.experienceLevel === 'newcomer' || data.experienceLevel === 'beginner') level = 'beginner';
    else if (data.experienceLevel === 'intermediate') level = 'intermediate';
    else level = 'advanced'; // advanced | expert

    // Map Goal to 'muscle' | 'fat_loss' | 'strength'
    // Recomp -> fat_loss (default safe bet for fitness apps, or we could add logic)
    let objective: 'muscle' | 'fat_loss' | 'strength' = 'fat_loss';
    if (data.goals.includes('recomp')) objective = 'fat_loss'; // Common mapping
    else if (data.goals.includes('strength')) objective = 'strength';
    else objective = 'muscle'; // Default/Endurance map to muscle for now or extend backend

    return { level, objective };
  }

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    const startTime = Date.now();

    try {
      const { level, objective } = getLegacyMapping();

      // Convert birthDate to ISO format for storage
      const isoBirthDate = data.biometrics.birthDate?.replace(/ \/ /g, '-') || null;
      const biometricsForStorage = {
        ...data.biometrics,
        birthDate: isoBirthDate
      };

      // Save User Profile
      await setDoc(doc(db, "users", user.uid), {
        displayName: data.displayName,
        username: data.username,
        biometrics: biometricsForStorage,
        experienceLevel: data.experienceLevel,
        daysPerWeek: data.daysPerWeek,
        goals: data.goals,
        equipment: data.equipment,
        injuries: data.injuries,
        posturalProblems: data.posturalProblems,
        acquisitionSource: data.acquisitionSource || 'other',
        country: data.country ? data.country.code : null,
        // Legacy fields
        objective: objective,
        level: level,
        healthCompleted: data.healthCompleted, // Save flag
      }, { merge: true });

      // Create Routine
      // Create Routine using Smart Engine
      console.log("Assigning routine via Smart Engine...");

      // Construct a UserProfile-like object for the service
      const tempProfile: any = {
        experienceLevel: data.experienceLevel,
        goals: data.goals,
        equipment: data.equipment,
        daysPerWeek: data.daysPerWeek,
        level: level, // Legacy support
      };

      const assignedRoutineId = await WorkoutService.assignRoutineFromTemplates(
        user.uid,
        tempProfile
      );

      if (!assignedRoutineId) {
        console.warn("Smart Engine found no match, falling back to legacy RoutineService.");
        await RoutineService.createAndAssignStarterRoutine(
          user.uid,
          data.daysPerWeek || 3,
          objective,
          level
        );
      }

      // Artificial Delay for UX
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 2000 - elapsed);
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
      <View style={[
        styles.inputContainer,
        usernameStatus === 'taken' && { borderColor: COLORS.error, borderWidth: 1 },
        usernameStatus === 'available' && { borderColor: COLORS.success, borderWidth: 1 }
      ]}>
        <Text style={styles.prefixIcon}>@</Text>
        <TextInput
          style={[styles.input, { paddingLeft: 0, flex: 1 }]}
          placeholder={t('onboarding.username_placeholder')}
          placeholderTextColor={COLORS.textTertiary}
          value={data.username.startsWith('@') ? data.username.substring(1) : data.username}
          onChangeText={(text) => {
            const clean = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
            setData({ ...data, username: '@' + clean });
          }}
          autoCapitalize="none"
          maxLength={20}
        />
        {usernameStatus === 'checking' && (
          <Text style={{ color: COLORS.textTertiary, fontSize: 12 }}>{t('onboarding.username_checking')}</Text>
        )}
        {usernameStatus === 'available' && (
          <Check size={18} color={COLORS.success} />
        )}
      </View>

      {/* Status text */}
      {usernameStatus === 'taken' ? (
        <Text style={[styles.helperText, { color: COLORS.error }]}>{t('onboarding.username_taken')}</Text>
      ) : usernameStatus === 'available' ? (
        <Text style={[styles.helperText, { color: COLORS.success }]}>{t('onboarding.username_available')}</Text>
      ) : (
        <Text style={styles.helperText}>{t('onboarding.username_helper')}</Text>
      )}

      {/* Username suggestions */}
      {usernameStatus === 'taken' && usernameSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsLabel}>{t('onboarding.username_suggestions')}</Text>
          <View style={styles.suggestionsRow}>
            {usernameSuggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => setData({ ...data, username: suggestion })}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderStep2_Biometrics = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('onboarding.step2_title')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.step2_subtitle')}</Text>

      <View style={styles.privacyBox}>
        <ShieldAlert size={16} color={COLORS.textTertiary} style={{ marginRight: 8 }} />
        <Text style={styles.privacyText}>
          {t('onboarding.privacy_warning')}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('onboarding.birth_date_label')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('onboarding.birth_date_placeholder')}
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="numeric"
              value={data.biometrics.birthDate || ""}
              onChangeText={(text) => {
                // Remove non-digits, then auto-insert slashes
                let digits = text.replace(/[^0-9]/g, '').slice(0, 8);
                let formatted = '';

                if (digits.length > 0) {
                  formatted = digits.slice(0, 4); // YYYY
                }
                if (digits.length >= 4) {
                  formatted += ' / ' + digits.slice(4, 6); // MM
                }
                if (digits.length >= 6) {
                  formatted += ' / ' + digits.slice(6, 8); // DD
                }

                setData({ ...data, biometrics: { ...data.biometrics, birthDate: formatted || null } });
              }}
              maxLength={14}
            />
          </View>
          {data.biometrics.birthDate && data.biometrics.birthDate.length === 14 && (() => {
            // Convert "YYYY / MM / DD" to "YYYY-MM-DD" for calculation
            const isoDate = data.biometrics.birthDate.replace(/ \/ /g, '-');
            return (
              <Text style={[styles.helperText, { marginTop: 4 }]}>
                {calculateAge(isoDate)} {t('onboarding.years_old')}
              </Text>
            );
          })()}
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
    const levels: { id: ExperienceLevel; labelKey: string; subKey: string }[] = [
      { id: 'newcomer', labelKey: 'onboarding.experience.newcomer', subKey: 'onboarding.experience.newcomer_sub' },
      { id: 'beginner', labelKey: 'onboarding.experience.beginner', subKey: 'onboarding.experience.beginner_sub' },
      { id: 'intermediate', labelKey: 'onboarding.experience.intermediate', subKey: 'onboarding.experience.intermediate_sub' },
      { id: 'advanced', labelKey: 'onboarding.experience.advanced', subKey: 'onboarding.experience.advanced_sub' },
      { id: 'expert', labelKey: 'onboarding.experience.expert', subKey: 'onboarding.experience.expert_sub' },
    ];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{t('onboarding.step3_title')}</Text>
        <Text style={styles.stepSubtitle}>{t('onboarding.experience.select_subtitle')}</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {levels.map((lvl) => (
            <TouchableOpacity
              key={lvl.id}
              style={[styles.card, data.experienceLevel === lvl.id && styles.cardActive]}
              onPress={() => setData({ ...data, experienceLevel: lvl.id })}
            >
              <View>
                <Text style={[styles.cardTitle, data.experienceLevel === lvl.id && styles.cardTitleActive]}>
                  {t(lvl.labelKey)}
                </Text>
                <Text style={styles.cardDesc}>{t(lvl.subKey)}</Text>
              </View>
              {data.experienceLevel === lvl.id && <Check size={20} color={COLORS.textInverse} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderStep4_Goals = () => {
    const goals: { id: UserGoal; labelKey: string; subKey: string; icon: any }[] = [
      { id: 'recomp', labelKey: 'onboarding.goals_options.recomp', subKey: 'onboarding.goals_options.recomp_sub', icon: Target },
      { id: 'strength', labelKey: 'onboarding.goals_options.strength', subKey: 'onboarding.goals_options.strength_sub', icon: Dumbbell },
      { id: 'endurance', labelKey: 'onboarding.goals_options.endurance', subKey: 'onboarding.goals_options.endurance_sub', icon: Activity },
    ];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{t('onboarding.step4_title')}</Text>
        <Text style={styles.stepSubtitle}>{t('onboarding.goals_options.select_subtitle')}</Text>

        {goals.map((item) => {
          const isSelected = data.goals.includes(item.id);
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, isSelected && styles.cardActive]}
              onPress={() => setData({ ...data, goals: [item.id] })} // Single select
            >
              <View style={styles.cardHeader}>
                <Icon size={24} color={isSelected ? COLORS.textInverse : COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { marginBottom: 4 }, isSelected && styles.cardTitleActive]}>
                    {t(item.labelKey)}
                  </Text>
                  <Text style={[styles.cardDesc, isSelected && { color: COLORS.textInverse + 'AA' }]}>
                    {t(item.subKey)}
                  </Text>
                </View>
              </View>
              {isSelected && <Check size={20} color={COLORS.textInverse} />}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderStep5_Equipment = () => {
    const equipmentOptions: { id: Equipment; labelKey: string; subKey: string; icon: any }[] = [
      { id: 'full_gym', labelKey: 'onboarding.equipment.full_gym', subKey: 'onboarding.equipment.full_gym_sub', icon: Dumbbell },
      { id: 'home_weights', labelKey: 'onboarding.equipment.home_weights', subKey: 'onboarding.equipment.home_weights_sub', icon: Weight },
      { id: 'bodyweight', labelKey: 'onboarding.equipment.bodyweight', subKey: 'onboarding.equipment.bodyweight_sub', icon: User },
    ];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{t('onboarding.equipment.title')}</Text>
        <Text style={styles.stepSubtitle}>{t('onboarding.equipment.subtitle')}</Text>

        {equipmentOptions.map((item) => {
          const isSelected = data.equipment === item.id;
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, isSelected && styles.cardActive]}
              onPress={() => setData({ ...data, equipment: item.id })}
            >
              <View style={styles.cardHeader}>
                <Icon size={24} color={isSelected ? COLORS.textInverse : COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { marginBottom: 4 }, isSelected && styles.cardTitleActive]}>
                    {t(item.labelKey)}
                  </Text>
                  <Text style={[styles.cardDesc, isSelected && { color: COLORS.textInverse + 'AA' }]}>
                    {t(item.subKey)}
                  </Text>
                </View>
              </View>
              {isSelected && <Check size={20} color={COLORS.textInverse} />}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderStep6_Frequency = () => {
    const days = [2, 3, 4, 5, 6];
    const isBeginner = data.experienceLevel === 'newcomer' || data.experienceLevel === 'beginner';

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{t('onboarding.frequency.title')}</Text>
        <Text style={styles.stepSubtitle}>{t('onboarding.frequency.subtitle')}</Text>

        {isBeginner && (data.daysPerWeek || 0) >= 5 && (
          <View style={{
            marginTop: 0,
            flexDirection: 'row',
            backgroundColor: COLORS.warning + '20',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            gap: 12
          }}>
            <AlertTriangle size={20} color={COLORS.warning} />
            <Text style={{ flex: 1, color: COLORS.warning, fontSize: 13, lineHeight: 18 }}>
              {t('onboarding.frequency.warning_beginner')}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: (isBeginner && (data.daysPerWeek || 0) >= 5) ? 16 : 32 }}>
          {days.map(d => {
            const isHighFreq = d >= 5;
            const showWarning = isBeginner && isHighFreq;

            return (
              <TouchableOpacity
                key={d}
                style={[
                  styles.frequencyBtn,
                  data.daysPerWeek === d && styles.frequencyBtnActive,
                  showWarning && { borderColor: COLORS.warning }
                ]}
                onPress={() => setData({ ...data, daysPerWeek: d })}
              >
                <View style={styles.frequencyContent}>
                  <Text style={[styles.frequencyText, data.daysPerWeek === d && styles.frequencyTextActive]}>
                    {d}
                  </Text>
                  <Text style={[styles.frequencySub, data.daysPerWeek === d && styles.frequencySubActive]}>
                    {t('onboarding.frequency.days_label')}
                  </Text>
                </View>

                {showWarning && (
                  <View style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: COLORS.warning,
                    borderRadius: 12,
                    padding: 4,
                    borderWidth: 2,
                    borderColor: COLORS.background
                  }}>
                    <AlertTriangle size={12} color={COLORS.background} fill={COLORS.warning} />
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>


      </View>
    );
  };

  const renderExpertDecision = () => (
    <View style={styles.stepContainer}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Globe size={48} color={COLORS.primary} style={{ marginBottom: 24, opacity: 0.8 }} />
        <Text style={[styles.stepTitle, { textAlign: 'center' }]}>
          {t('onboarding.expert_branch.title')}
        </Text>
        <Text style={[styles.stepSubtitle, { textAlign: 'center', maxWidth: '90%' }]}>
          {t('onboarding.expert_branch.message')}
        </Text>

        <View style={{ width: '100%', gap: 16, marginTop: 32 }}>
          {/* Option A: Complete Route */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleExpertDecision('complete')}
          >
            <View>
              <Text style={styles.cardTitle}>{t('onboarding.expert_branch.option_complete')}</Text>
              <Text style={styles.cardDesc}>{t('onboarding.expert_branch.option_complete_desc')}</Text>
            </View>
            <ShieldAlert size={20} color={COLORS.primary} style={{ alignSelf: 'center' }} />
          </TouchableOpacity>

          {/* Option B: Direct Route */}
          <TouchableOpacity
            style={[styles.card, { borderColor: COLORS.textTertiary + '40' }]}
            onPress={() => handleExpertDecision('direct')}
          >
            <View>
              <Text style={styles.cardTitle}>{t('onboarding.expert_branch.option_direct')}</Text>
              <Text style={styles.cardDesc}>{t('onboarding.expert_branch.option_direct_desc')}</Text>
            </View>
            <Zap size={20} color={COLORS.textTertiary} style={{ alignSelf: 'center' }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    if (showExpertDecision) return renderExpertDecision();
    switch (currentStep) {
      case 1: return renderStep1_Identity();
      case 2: return renderStep2_Biometrics();
      case 3: return renderStep3_Experience();
      case 4: return renderStep4_Goals();
      case 5: return renderStep5_Equipment();
      case 6: return renderStep6_Frequency();
      case 7: return renderStep7_Safety();
      case 8: return renderStep8_Acquisition();
    }
  };

  const renderStep7_Safety = () => {
    const injuries: { id: any; titleKey: string }[] = [
      { id: 'shoulders', titleKey: 'onboarding.injuries.shoulders' },
      { id: 'knees', titleKey: 'onboarding.injuries.knees' },
      { id: 'lower_back', titleKey: 'onboarding.injuries.lower_back' },
      { id: 'wrists', titleKey: 'onboarding.injuries.wrists' },
      { id: 'none', titleKey: 'onboarding.injuries.none' },
    ];

    const posturalProblemsItems: { id: PosturalProblem; titleKey: string }[] = [
      { id: 'scoliosis', titleKey: 'onboarding.postural_problems.scoliosis' },
      { id: 'kyphosis', titleKey: 'onboarding.postural_problems.kyphosis' },
      { id: 'hyperlordosis', titleKey: 'onboarding.postural_problems.hyperlordosis' },
      { id: 'none', titleKey: 'onboarding.postural_problems.none' },
    ];

    const toggleInjury = (id: any) => {
      let newInjuries = [...data.injuries];
      if (id === 'none') {
        newInjuries = ['none'];
      } else {
        newInjuries = newInjuries.filter(i => i !== 'none');
        if (newInjuries.includes(id)) {
          newInjuries = newInjuries.filter(i => i !== id);
        } else {
          newInjuries.push(id);
        }
      }
      setData({ ...data, injuries: newInjuries });
    };

    const togglePosturalProblem = (id: PosturalProblem) => {
      let newProblems = [...data.posturalProblems];
      if (id === 'none') {
        newProblems = ['none'];
      } else {
        newProblems = newProblems.filter(p => p !== 'none');
        if (newProblems.includes(id)) {
          newProblems = newProblems.filter(p => p !== id);
        } else {
          newProblems.push(id);
        }
      }
      setData({ ...data, posturalProblems: newProblems });
    };

    const renderSelectionItem = (
      id: string,
      titleKey: string,
      isSelected: boolean,
      isNone: boolean,
      onPress: () => void
    ) => (
      <TouchableOpacity
        key={id}
        style={[
          styles.selectionRow,
          isSelected && (isNone ? styles.selectionRowSuccess : styles.selectionRowWarning)
        ]}
        onPress={onPress}
      >
        <Text style={[
          styles.selectionText,
          isSelected && { color: isNone ? COLORS.textInverse : COLORS.background }
        ]}>
          {t(titleKey)}
        </Text>
        {isSelected && <Check size={18} color={isNone ? COLORS.textInverse : COLORS.background} />}
      </TouchableOpacity>
    );

    return (
      <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>{t('onboarding.step5_title')}</Text>
        <Text style={styles.stepSubtitle}>{t('onboarding.injuries_subtitle')}</Text>

        {/* Injuries Section */}
        <Text style={styles.sectionLabel}>{t('onboarding.injuries.title')}</Text>
        <View style={styles.selectionContainer}>
          {injuries.map((item) => {
            const isSelected = data.injuries.includes(item.id as any);
            const isNone = item.id === 'none';
            return renderSelectionItem(item.id, item.titleKey, isSelected, isNone, () => toggleInjury(item.id));
          })}
        </View>

        {/* Postural Problems Section */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('onboarding.postural_problems.title')}</Text>
        <View style={styles.selectionContainer}>
          {posturalProblemsItems.map((item) => {
            const isSelected = data.posturalProblems.includes(item.id);
            const isNone = item.id === 'none';
            return renderSelectionItem(item.id, item.titleKey, isSelected, isNone, () => togglePosturalProblem(item.id));
          })}
        </View>
      </ScrollView>
    );
  };

  const renderStep8_Acquisition = () => {
    const sources: { id: AcquisitionSource, labelKey: string, icon: any }[] = [
      { id: 'instagram', labelKey: 'Instagram', icon: Instagram },
      { id: 'tiktok', labelKey: 'TikTok', icon: Share2 },
      { id: 'youtube', labelKey: 'YouTube', icon: Play },
      { id: 'google', labelKey: 'Google / Web', icon: Globe },
      { id: 'friend', labelKey: 'onboarding.acquisition.friend', icon: Users },
      { id: 'other', labelKey: 'onboarding.acquisition.other', icon: Eye },
    ];

    return (
      <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.stepTitle}>{t('onboarding.acquisition.title')}</Text>
          <TouchableOpacity onPress={() => handleNext()}>
            <Text style={{ color: COLORS.textTertiary, ...TYPOGRAPHY.button }}>{t('onboarding.acquisition.skip')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.stepSubtitle}>{t('onboarding.acquisition.subtitle')}</Text>

        {/* Country Selector */}
        <Text style={styles.label}>{t('onboarding.acquisition.country_label')}</Text>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowCountryModal(true)}
        >
          <Globe size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
          <Text style={[styles.input, { lineHeight: 56, color: data.country ? COLORS.textPrimary : COLORS.textTertiary }]}>
            {data.country ? data.country.name : t('onboarding.acquisition.country_placeholder')}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
          {sources.map(src => {
            const isSelected = data.acquisitionSource === src.id;
            const Icon = src.icon;
            // Use translation for friend/other, otherwise use labelKey directly (brand names)
            const label = src.labelKey.startsWith('onboarding.') ? t(src.labelKey) : src.labelKey;
            return (
              <TouchableOpacity
                key={src.id}
                style={[styles.acquisitionCard, isSelected && styles.acquisitionCardActive]}
                onPress={() => setData({ ...data, acquisitionSource: src.id })}
              >
                <Icon size={24} color={isSelected ? COLORS.textInverse : COLORS.textPrimary} />
                <Text style={[styles.acquisitionText, isSelected && { color: COLORS.textInverse }]}>{label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Country Modal */}
        <Modal
          visible={showCountryModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCountryModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: COLORS.background, paddingTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <TouchableOpacity onPress={() => setShowCountryModal(false)} style={{ padding: 8 }}>
                <ArrowLeft size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 8, paddingHorizontal: 12, height: 40 }}>
                <Search size={16} color={COLORS.textTertiary} style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, color: COLORS.textPrimary, fontFamily: FONT_FAMILY.regular }}
                  placeholder={t('onboarding.acquisition.country_search')}
                  placeholderTextColor={COLORS.textTertiary}
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                  autoFocus
                />
              </View>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              {COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border }}
                  onPress={() => {
                    setData({ ...data, country: country });
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={{ color: COLORS.textPrimary, fontFamily: FONT_FAMILY.medium, fontSize: 16 }}>
                    {country.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    )
  }

  const renderResults = () => {
    const bmi = calculateBMI(data.biometrics.weight || 0, data.biometrics.height || 0);
    // Convert "YYYY / MM / DD" to "YYYY-MM-DD" for calculation
    const isoBirthDate = data.biometrics.birthDate?.replace(/ \/ /g, '-') || null;
    const age = calculateAge(isoBirthDate);
    const bmr = calculateBMR(
      data.biometrics.weight || 0,
      data.biometrics.height || 0,
      age,
      data.biometrics.gender || 'male' // Fallback
    );
    const tdee = calculateTDEE(bmr, data.daysPerWeek || 3);
    const weightClass = getWeightClass(bmi);

    const activityCalories = tdee - bmr;
    const baseWidth = (bmr / tdee) * 100;
    const activityWidth = (activityCalories / tdee) * 100;

    // BMI Calculation for gauge
    const bmiSegments = ['underweight', 'normal', 'overweight', 'obese'];
    const bmiColors = {
      underweight: COLORS.accent,
      normal: COLORS.success,
      overweight: COLORS.warning,
      obese: COLORS.error
    };

    return (
      <View style={styles.resultsContainer}>
        <View style={{ marginBottom: 24, alignItems: 'center' }}>
          {/* MENS Logo Style Text? Or just Diagnosis Title */}
          <Text style={styles.diagnosisTitle}>{t('onboarding.diagnosis.title')}</Text>
          <Text style={styles.stepSubtitle}>{t('onboarding.diagnosis.subtitle')}</Text>
        </View>

        {/* Card 1: BMR (Metabolism) */}
        <View style={styles.resultCard}>
          <View style={styles.resultHeaderRow}>
            <Activity size={18} color={COLORS.success} />
            <Text style={styles.resultLabel}>{t('onboarding.diagnosis.bmr_label')}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <AnimatedNumber value={bmr} />
            <Text style={styles.measureUnit}>{t('onboarding.diagnosis.bmr_unit')}</Text>
          </View>

          <Text style={styles.resultDesc}>
            {t('onboarding.diagnosis.bmr_desc')}
          </Text>
        </View>

        {/* Card 2: TDEE (Maintenance) */}
        <View style={styles.resultCard}>
          <View style={styles.resultHeaderRow}>
            <Zap size={18} color={COLORS.textSecondary} />
            <Text style={styles.resultLabel}>{t('onboarding.diagnosis.maintenance_label')}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <AnimatedNumber value={tdee} />
              <Text style={styles.measureUnit}>kcal</Text>
            </View>
            <View>
              <Text style={[styles.barLabelText, { color: COLORS.success, textAlign: 'right' }]}>
                {t('onboarding.diagnosis.activity_label')}
              </Text>
              <Text style={[styles.barLabelText, { color: COLORS.success, fontSize: 14, textAlign: 'right' }]}>
                +{activityCalories} kcal
              </Text>
            </View>
          </View>

          {/* Segmented Bar */}
          <View style={styles.barContainer}>
            <View style={[styles.barSegment, { width: `${baseWidth}%`, backgroundColor: COLORS.textTertiary + '40' }]} />
            <View style={[styles.barSegment, { width: `${activityWidth}%`, backgroundColor: COLORS.success }]} />
          </View>
          <View style={styles.barLabels}>
            <Text style={styles.barLabelText}>{t('onboarding.diagnosis.base_label')}</Text>
            <Text style={[styles.barLabelText, { color: COLORS.success }]}>{t('onboarding.diagnosis.total_label')} {tdee}</Text>
          </View>
        </View>

        {/* Card 3: BMI (IMC) */}
        <View style={styles.resultCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={styles.resultHeaderRow}>
              <User size={18} color={COLORS.textSecondary} />
              <Text style={styles.resultLabel}>{t('onboarding.diagnosis.bmi_label')}</Text>
            </View>
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              backgroundColor: bmiColors[weightClass] + '20',
              borderRadius: 4,
              borderWidth: 1,
              borderColor: bmiColors[weightClass]
            }}>
              <Text style={[styles.barLabelText, { color: bmiColors[weightClass] }]}>
                {weightClass.toUpperCase() === 'NORMAL' ? 'NORMAL' : weightClass.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.metricValue}>{bmi}</Text>
            <Text style={styles.measureUnit}>{t('onboarding.diagnosis.bmi_unit')}</Text>
          </View>

          {/* Gauge */}
          <View style={styles.gaugeContainer}>
            {bmiSegments.map((seg, index) => {
              const isActive = weightClass === seg;
              return (
                <View
                  key={seg}
                  style={[styles.gaugeSegment, {
                    backgroundColor: (bmiColors as any)[seg],
                    opacity: isActive ? 1 : 0.2
                  }]}
                />
              );
            })}
          </View>
          <View style={styles.gaugeLabelsRow}>
            <Text style={styles.gaugeLabel}>{t('onboarding.diagnosis.underweight')}</Text>
            <Text style={[styles.gaugeLabel, { color: COLORS.success }]}>{t('onboarding.diagnosis.normal')}</Text>
            <Text style={styles.gaugeLabel}>{t('onboarding.diagnosis.overweight')}</Text>
            <Text style={styles.gaugeLabel}>{t('onboarding.diagnosis.obese')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.nextButton, { marginTop: 24, marginBottom: 40 }, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.nextButtonText}>
            {saving ? loadingMessages[loadingMessageIndex] : t('onboarding.diagnosis.start_plan')}
          </Text>
          {!saving && <ArrowRight size={20} color={COLORS.textInverse} />}
        </TouchableOpacity>
      </View>
    )
  }

  // --- Main Render ---

  if (showResults) {
    return (
      <View style={[styles.container, { paddingTop: 80 }]}>
        {renderResults()}
      </View>
    )
  }

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
        <Text style={styles.stepCounter}>{currentStep} / {STEPS}</Text>
      </View>

      {/* Content */}
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
          {renderCurrentStep()}
        </ScrollView>

        {/* Navigation Buttons (Hide during Expert Decision as it has its own buttons) */}
        {!showExpertDecision && (
          <View style={styles.footer}>
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <View style={styles.footerButtons}>
              {currentStep > 1 && (
                <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={saving}>
                  <ArrowLeft size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.nextButton, saving && { opacity: 0.7 }]}
                onPress={handleNext}
                disabled={saving}
              >
                <Text style={styles.nextButtonText}>
                  {currentStep === STEPS ? "FINALIZAR" : "CONTINUAR"}
                </Text>
                {!saving && <ArrowRight size={20} color={COLORS.textInverse} />}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
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
    backgroundColor: COLORS.card,
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
    paddingBottom: 20,
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
    textAlign: 'center'
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
  /* Inputs */
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
  /* Gender Toggle */
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
    backgroundColor: COLORS.cardAlt,
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
  /* Cards */
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
    backgroundColor: COLORS.success,
  },
  cardWarning: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warning,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.sm,
  },
  /* Footer */
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
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
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
    fontSize: FONT_SIZE.md,
  },
  errorText: {
    color: COLORS.error,
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginBottom: 12,
  },
  privacyBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardAlt,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  privacyText: {
    flex: 1,
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  /* Frequency */
  frequencyBtn: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  frequencyBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  frequencyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  frequencyText: {
    fontFamily: FONT_FAMILY.heavy,
    fontSize: 48,
    lineHeight: 52,
    color: COLORS.textPrimary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  frequencyTextActive: {
    color: COLORS.textInverse,
  },
  frequencySub: {
    ...TYPOGRAPHY.button,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  frequencySubActive: {
    color: COLORS.textInverse,
  },
  /* Acquisition */
  acquisitionCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  acquisitionCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  acquisitionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontWeight: '600'
  },
  /* Results */
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginTop: 40,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginBottom: 8,
    textAlign: 'center'
  },
  metricValue: {
    ...TYPOGRAPHY.display,
    fontSize: 32,
    color: COLORS.textPrimary,
  },
  metricSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4
  },
  infoBox: {
    marginTop: 24,
    backgroundColor: COLORS.cardAlt,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: FONT_SIZE.sm
  },
  /* Diagnosis Screen */
  diagnosisTitle: {
    ...TYPOGRAPHY.display,
    fontSize: 24,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  resultCard: {
    width: '100%',
    backgroundColor: 'rgba(21, 25, 34, 0.8)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  resultLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  measureUnit: {
    color: COLORS.textTertiary,
    fontSize: 16,
    fontFamily: FONT_FAMILY.regular,
    marginLeft: 4,
  },
  resultDesc: {
    color: COLORS.textTertiary,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  /* Segmented Bar */
  barContainer: {
    height: 12,
    flexDirection: 'row',
    borderRadius: 6,
    backgroundColor: '#1E2430',
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 4,
  },
  barSegment: {
    height: '100%',
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  barLabelText: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.bold,
    textTransform: 'uppercase',
  },
  /* BMI Gauge */
  gaugeContainer: {
    marginTop: 20,
    height: 8,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    gap: 4,
  },
  gaugeSegment: {
    flex: 1,
    height: '100%',
    borderRadius: 4,
  },
  gaugeLabelsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  gaugeLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
  },
  /* Username suggestions */
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionsLabel: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginBottom: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
  },
  /* Selection List Styles (Safety Protocol) */
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  selectionContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  selectionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectionRowSuccess: {
    backgroundColor: COLORS.success,
  },
  selectionRowWarning: {
    backgroundColor: COLORS.warning,
  },
  selectionText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: FONT_FAMILY.medium,
  }
});


