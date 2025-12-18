import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../src/theme/theme';

/**
 * Typography Demo Component
 * 
 * Este componente demuestra cómo usar los alias tipográficos de Antigravity.
 * Puedes copiar este código en cualquier pantalla para verificar que las fuentes
 * funcionan correctamente.
 * 
 * Aliases disponibles:
 * - 'Antigravity-Display': Dela Gothic One (títulos principales)
 * - 'Antigravity-UI-Reg': Inter Regular (texto de cuerpo)
 * - 'Antigravity-UI-Bold': Inter Bold (botones, subtítulos)
 * - 'Antigravity-UI-Black': Inter Black (datos, números destacados)
 */
export default function TypographyDemo() {
    return (
        <View style={styles.container}>
            {/* Título Principal - Dela Gothic One */}
            <Text style={styles.displayTitle}>ANTIGRAVITY</Text>

            {/* Subtítulo - Inter Bold */}
            <Text style={styles.subtitle}>Sistema Tipográfico Industrial</Text>

            {/* Texto de cuerpo - Inter Regular */}
            <Text style={styles.bodyText}>
                Este es un ejemplo de texto de cuerpo usando Inter Regular.
                Perfecto para descripciones, instrucciones y contenido general.
            </Text>

            {/* Datos destacados - Inter Black */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>1,250</Text>
                    <Text style={styles.statLabel}>Calorías</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>45</Text>
                    <Text style={styles.statLabel}>Minutos</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>12</Text>
                    <Text style={styles.statLabel}>Ejercicios</Text>
                </View>
            </View>

            {/* Botón de ejemplo */}
            <View style={styles.button}>
                <Text style={styles.buttonText}>COMENZAR ENTRENAMIENTO</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 24,
        justifyContent: 'center',
    },
    displayTitle: {
        fontFamily: 'Antigravity-Display',
        fontSize: 42,
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 2,
    },
    subtitle: {
        fontFamily: 'Antigravity-UI-Bold',
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        textTransform: 'uppercase',
        letterSpacing: 3,
    },
    bodyText: {
        fontFamily: 'Antigravity-UI-Reg',
        fontSize: 15,
        color: COLORS.textPrimary,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 32,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    statNumber: {
        fontFamily: 'Antigravity-UI-Black',
        fontSize: 28,
        color: COLORS.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontFamily: 'Antigravity-UI-Reg',
        fontSize: 12,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: 'Antigravity-UI-Bold',
        fontSize: 14,
        color: COLORS.background,
        letterSpacing: 2,
    },
});
