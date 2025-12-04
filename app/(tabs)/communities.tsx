import { Users } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
        <View style={styles.iconContainer}>
          <Users size={60} color={COLORS.primary} strokeWidth={2} />
        </View>

        {/* Main Message */}
        <Text style={styles.mainText}>{t('communities.training_message')}</Text>

        {/* Secondary Message */}
        <Text style={styles.secondaryText}>
          {t('communities.coming_soon')}
        </Text>

        {/* CTA Button */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={t('communities.notify_me')}
            onPress={handleNotifyMe}
          />
        </View>
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