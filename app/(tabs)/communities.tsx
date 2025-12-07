import { Users } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AnimatedCard,
  AnimatedPopIn,
  AnimatedSection,
} from "../../src/components/common/Animations";
import { PrimaryButton } from "../../src/components/common/PrimaryButton";
import { COLORS } from "../../src/theme/theme";
import { showToast } from "../../src/utils/toast";

const CommunitiesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const handleNotifyMe = () => {
    showToast.success(t('communities.notify_success'));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Icon */}
        <AnimatedPopIn delay={0}>
          <View style={styles.iconContainer}>
            <Users size={60} color={COLORS.primary} strokeWidth={2} />
          </View>
        </AnimatedPopIn>

        {/* Main Message */}
        <AnimatedCard delay={100}>
          <Text style={styles.mainText}>{t('communities.training_message')}</Text>
        </AnimatedCard>

        {/* Secondary Message */}
        <AnimatedCard delay={200}>
          <Text style={styles.secondaryText}>
            {t('communities.coming_soon')}
          </Text>
        </AnimatedCard>

        {/* CTA Button */}
        <AnimatedSection delay={400}>
          <View style={styles.buttonContainer}>
            <PrimaryButton
              title={t('communities.notify_me')}
              onPress={handleNotifyMe}
            />
          </View>
        </AnimatedSection>
      </View>
    </View>
  );
};

export default CommunitiesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  mainText: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  secondaryText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
  },
});