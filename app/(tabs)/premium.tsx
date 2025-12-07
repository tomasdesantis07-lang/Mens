import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCard, AnimatedHeader } from '../../src/components/common/Animations';
import { COLORS } from '../../src/theme/theme';

const PremiumScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <AnimatedHeader>
        <Text style={styles.title}>{t('premium.title')}</Text>
      </AnimatedHeader>
      <AnimatedCard delay={100}>
        <Text style={styles.text}>
          {t('premium.placeholder')}
        </Text>
      </AnimatedCard>
    </View>
  );
};

export default PremiumScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});