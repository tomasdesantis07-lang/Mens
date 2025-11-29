import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DaySelectorSheet } from "../../src/components/specific/DaySelectorSheet";
import { RoutineCard } from "../../src/components/specific/RoutineCard";
import { useWorkout } from "../../src/context/WorkoutContext";
import { auth, db } from "../../src/services/firebaseConfig";
import { RoutineService } from "../../src/services/routineService";
import { COLORS } from "../../src/theme/theme";
import { Routine } from "../../src/types/routine";

type UserData = {
  email?: string;
  displayName?: string;
  objective?: string | null;
  daysPerWeek?: number | null;
  level?: string | null;
  isPremium?: boolean;
};

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoutines, setUserRoutines] = useState<Routine[]>([]);
  const [communityRoutines, setCommunityRoutines] = useState<Routine[]>([]);
  const [selectedRoutineForTraining, setSelectedRoutineForTraining] = useState<Routine | null>(null);

  const { startWorkout, activeWorkout } = useWorkout();

  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserData(snap.data() as UserData);
        }

        const routines = await RoutineService.getUserRoutines(user.uid);
        setUserRoutines(routines);

        const community = await RoutineService.getCommunityRoutines();
        setCommunityRoutines(community);
      } catch (e) {
        console.log("Error loading data", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const displayName =
    userData?.displayName && userData.displayName.trim() !== ""
      ? userData.displayName
      : userData?.email ?? "Atleta";

  const handleCreateRoutine = () => {
    router.push("../routines/create" as any);
  };

  const handleSelectDay = (dayIndex: number) => {
    if (selectedRoutineForTraining) {
      startWorkout(selectedRoutineForTraining, dayIndex);
      setSelectedRoutineForTraining(null);
      router.push(`../routines/${selectedRoutineForTraining.id}/train` as any);
    }
  };

  const handleResumeWorkout = () => {
    if (activeWorkout) {
      router.push(`../routines/${activeWorkout.routine.id}/train` as any);
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20 },
        ]}
      >
        <Text style={styles.greeting}>Hola, {displayName}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Rutinas</Text>

          {userRoutines.length === 0 ? (
            <Text style={styles.emptyText}>
              Aún no tenés rutinas guardadas
            </Text>
          ) : (
            userRoutines.map((routine) => (
              <RoutineCard
                key={routine.id}
                name={routine.name}
                days={routine.daysPerWeek}
                volume={0}
                variant="user"
                onPress={() => setSelectedRoutineForTraining(routine)}
                onEdit={() => router.push(`../routines/edit/${routine.id}` as any)}
              />
            ))
          )}

          <TouchableOpacity
            style={styles.newRoutineCard}
            onPress={handleCreateRoutine}
          >
            <Text style={styles.newRoutineText}>+ Nueva</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rutinas de la comunidad</Text>

          {communityRoutines.length === 0 ? (
            <Text style={styles.emptyText}>
              No hay rutinas de la comunidad disponibles
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {communityRoutines.map((routine) => (
                <View key={routine.id} style={styles.communityCard}>
                  <RoutineCard
                    name={routine.name}
                    days={routine.daysPerWeek}
                    volume={0}
                    variant="community"
                    onPress={() => console.log("Start:", routine.name)}
                  />
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.viewMore}
            onPress={() => console.log("View more community routines")}
          >
            <Text style={styles.viewMoreText}>Ver más...</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DaySelectorSheet
        visible={!!selectedRoutineForTraining}
        routine={selectedRoutineForTraining}
        onClose={() => setSelectedRoutineForTraining(null)}
        onSelectDay={handleSelectDay}
      />

      {activeWorkout && (
        <TouchableOpacity style={styles.resumeBar} onPress={handleResumeWorkout}>
          <View>
            <Text style={styles.resumeTitle}>Rutina en curso</Text>
            <Text style={styles.resumeSubtitle}>
              {activeWorkout.routine.name} - Día {activeWorkout.dayIndex + 1}
            </Text>
          </View>
          <Text style={styles.resumeAction}>Continuar</Text>
        </TouchableOpacity>
      )}
    </>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
  },
  newRoutineCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  newRoutineText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  horizontalList: {
    gap: 12,
    paddingRight: 24,
  },
  communityCard: {
    width: 280,
  },
  viewMore: {
    marginTop: 12,
    alignItems: "center",
  },
  viewMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  resumeBar: {
    position: "absolute",
    bottom: 20,
    left: 24,
    right: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resumeTitle: {
    color: COLORS.textInverse,
    fontWeight: "700",
    fontSize: 14,
  },
  resumeSubtitle: {
    color: COLORS.textInverse,
    opacity: 0.8,
    fontSize: 12,
  },
  resumeAction: {
    color: COLORS.textInverse,
    fontWeight: "600",
  },
});