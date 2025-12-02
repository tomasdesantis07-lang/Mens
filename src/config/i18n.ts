import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.json";
import es from "../locales/es.json";

const LANGUAGE_KEY = "user-language";

const resources = {
    en: { translation: en },
    es: { translation: es },
};

export const initI18n = async () => {
    try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

        // If language is saved, use it. Otherwise, use device locale (fallback to 'es')
        const locales = Localization.getLocales();
        const deviceLanguage = locales && locales.length > 0 ? locales[0].languageCode : "es";
        const languageToUse = savedLanguage || (deviceLanguage?.startsWith("en") ? "en" : "es");

        await i18n.use(initReactI18next).init({
            resources,
            lng: languageToUse,
            fallbackLng: "es",
            interpolation: {
                escapeValue: false,
            },
            compatibilityJSON: 'v4', // For Android compatibility
        });

        return languageToUse;
    } catch (error) {
        console.error("Error initializing i18n:", error);
        // Fallback init in case of error
        if (!i18n.isInitialized) {
            await i18n.use(initReactI18next).init({
                resources,
                lng: "es",
                fallbackLng: "es",
                interpolation: { escapeValue: false },
                compatibilityJSON: 'v4',
            });
        }
        return "es";
    }
};

export const changeLanguage = async (lang: "es" | "en") => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
};

export default i18n;
