import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Award, Dumbbell, Plus, Trophy } from 'lucide-react-native';
import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AnimatedPopIn,
  AnimatedSection
} from '../../src/components/common/Animations';
import { AchievementCard } from '../../src/components/profile/AchievementCard';
import { ProfileMenuSheet } from '../../src/components/profile/ProfileMenuSheet';
import { RoutinePreviewCard } from '../../src/components/profile/RoutinePreviewCard';
import { RoutinePreviewSheet } from '../../src/components/profile/RoutinePreviewSheet';
import { useRoutines } from '../../src/hooks/useRoutines';
import { useTabBarInset } from '../../src/hooks/useTabBarInset';
import { auth, db } from '../../src/services/firebaseConfig';
import { COLORS, FONT_FAMILY } from '../../src/theme/theme';
import { Routine } from '../../src/types/routine';

type UserData = {
  email?: string;
  displayName?: string;
  username?: string;
  photoURL?: string;
};

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const [menuVisible, setMenuVisible] = useState(false);
  const { data: userData = null } = useQuery({
    queryKey: ['user', auth.currentUser?.uid],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      return userDoc.exists() ? (userDoc.data() as UserData) : null;
    },
    enabled: !!auth.currentUser,
    initialData: auth.currentUser?.uid === 'guest' ? null : undefined,
  });

  const { routines: userRoutines } = useRoutines();
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/auth' as any);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const displayName = userData?.displayName || auth.currentUser?.email?.split('@')[0] || 'Usuario';
  const username = userData?.username || '';

  // Mock achievements data
  const achievements = [
    {
      icon: Dumbbell,
      title: t('profile.achievements_list.first_workout'),
      description: t('profile.achievements_list.first_workout_desc'),
      unlocked: userRoutines.length > 0,
    },
    {
      icon: Trophy,
      title: t('profile.achievements_list.week_streak'),
      description: t('profile.achievements_list.week_streak_desc'),
      unlocked: false,
    },
    {
      icon: Award,
      title: t('profile.achievements_list.ten_workouts'),
      description: t('profile.achievements_list.ten_workouts_desc'),
      unlocked: false,
    },
  ];

  return (
    <>
      <View style={styles.container}>
        {/* App Bar moved to layout */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingTop: 80 + insets.top, paddingBottom: tabBarInset },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <AnimatedSection delay={0}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {userData?.photoURL ? (
                  <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.displayName}>{displayName}</Text>
              {username && <Text style={styles.username}>{username}</Text>}
            </View>
          </AnimatedSection>

          <AnimatedSection delay={100} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.my_routines')}</Text>

            <View style={styles.routinesGrid}>
              {(userRoutines || []).map((routine, index) => (
                <AnimatedPopIn key={routine.id} index={index} delay={150} style={styles.routineItem}>
                  <RoutinePreviewCard
                    name={routine.name}
                    daysPerWeek={routine.daysPerWeek}
                    isGeneratedForUser={routine.isGeneratedForUser}
                    onPress={() => setSelectedRoutine(routine)}
                  />
                </AnimatedPopIn>
              ))}

              {/* Add New Routine Card */}
              <AnimatedPopIn index={userRoutines.length} delay={150} style={styles.routineItem}>
                <TouchableOpacity
                  style={styles.addRoutineCard}
                  onPress={() => router.push('/routines/create' as any)}
                  activeOpacity={0.7}
                >
                  <Plus size={32} color={COLORS.textTertiary} strokeWidth={1.5} />
                </TouchableOpacity>
              </AnimatedPopIn>
            </View>
          </AnimatedSection>

          {/* Achievements Section */}
          <AnimatedSection delay={200} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.achievements')}</Text>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement, index) => (
                <AnimatedPopIn key={index} index={index} delay={250} style={styles.achievementItem}>
                  <AchievementCard
                    icon={achievement.icon}
                    title={achievement.title}
                    description={achievement.description}
                    unlocked={achievement.unlocked}
                  />
                </AnimatedPopIn>
              ))}
            </View>
          </AnimatedSection>
        </ScrollView>
      </View>

      <ProfileMenuSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSettings={() => console.log('Settings')}
        onEditProfile={() => console.log('Edit Profile')}
        onSignOut={handleSignOut}
      />

      <RoutinePreviewSheet
        visible={!!selectedRoutine}
        routine={selectedRoutine}
        onClose={() => setSelectedRoutine(null)}
      />
    </>
  );
};

export default memo(ProfileScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.textInverse,
  },
  displayName: {
    fontSize: 24,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  routinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  routineItem: {
    width: '48%',
  },
  addRoutineCard: {
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementItem: {
    width: '48%',
  },
});