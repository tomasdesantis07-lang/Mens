import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, BackHandler, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY } from '../src/theme/theme';

export default function WarningScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const opacityAnim = useRef(new Animated.Value(1)).current;
    const transitionStarted = useRef(false);

    const startTransition = useCallback(() => {
        if (transitionStarted.current) return;
        transitionStarted.current = true;

        Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                router.replace('/(tabs)/home');
            }
        });
    }, [opacityAnim, router]);

    useEffect(() => {
        // Prevent back button
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

        // Fallback timer: transit after 8 seconds
        const fallbackTimer = setTimeout(() => {
            console.log("[WarningScreen] Fallback timer triggered.");
            startTransition();
        }, 8000);

        return () => {
            backHandler.remove();
            clearTimeout(fallbackTimer);
        };
    }, [startTransition]);

    return (
        <Animated.View style={[styles.container, { opacity: opacityAnim, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar style="light" hidden={true} />

            <View style={styles.content}>
                <Text style={styles.title} adjustsFontSizeToFit numberOfLines={1}>ADVERTENCIA</Text>

                <Text style={styles.body}>
                    Si estás leyendo esto, esta advertencia es para vos. Con cada segundo que pasas acá leyendo esta estúpida cláusula, perdés un segundo de tu vida. Por cada palabra que lees, tu tiempo se consume. Porque no tenés nada importante que hacer. No sos especial ni hermoso. Tampoco sos una basura o alguien inútil. Solo sos parte del mismo montón de gente de todo el mundo. Sos una estadística. Alguien promedio. Compras innecesarias. Impulsos vacíos y la masturbación mental que te das diciéndote que todo estará bien. Que vos podés. Que sos especial. Y lo único que sos es una tumba emocional andante. ¿Y si murieras mañana? ¿Estarías feliz con tu vida? Esperás que todo se acomode o sea perfecto pero no. Por eso mismo acudiste a nosotros. Necesitás que te dejen de hablar con amor. Necesitás un cachetazo de realidad. Empezar a vivir y a proclamar tu humanidad. Por eso estamos acá. No para abrazarte o motivarte. Te vamos a incomodar para que despiertes y dejes de ser un simple y miserable espectador.
                    {"\n\n"}
                    Mens.
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    content: {
        maxWidth: 600,
        alignSelf: 'center',
    },
    title: {
        ...TYPOGRAPHY.h1, // Inter bold
        fontSize: 28,
        marginBottom: 20,
        textAlign: 'center',
        color: COLORS.error,
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    body: {
        ...TYPOGRAPHY.bodySmall, // Inter
        color: COLORS.textSecondary,
        lineHeight: 20,
        textAlign: 'justify',
        fontSize: 12,
    },
});
