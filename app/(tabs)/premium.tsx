import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCard } from '../../src/components/common/Animations';
import { useTabBarInset } from '../../src/hooks/useTabBarInset';
import { COLORS } from '../../src/theme/theme';

const PremiumScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: 80 + insets.top, paddingBottom: tabBarInset },
        ]}
        showsVerticalScrollIndicator={false}
      >

        <AnimatedCard delay={100}>
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              {t('premium.placeholder')}
            </Text>
          </View>
        </AnimatedCard>
      </ScrollView>
    </View>
  );
};

export default memo(PremiumScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  placeholderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderText: {
    color: COLORS.textTertiary,
    fontSize: 14,
    textAlign: 'center',
  },
});