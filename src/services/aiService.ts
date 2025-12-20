/**
 * AIService.ts - MENS AI Routine Generation Backend
 * 
 * Conexión con Gemini Flash para generación de rutinas de entrenamiento.
 * Este servicio está diseñado para la Fase Beta - oculto al usuario pero funcional.
 * 
 * @author Antigravity Engineering Unit
 * @version 1.0.0-beta
 */

import { GenerativeModel, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { PredefinedSet, RoutineDay, RoutineDraft, RoutineExercise } from "../types/routine";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * API Key placeholder - DEBE ser movida a variables de entorno en producción.
 * Para desarrollo, usar archivo .env o constants seguros.
 */
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

/**
 * Modelo de Gemini a utilizar
 * gemini-2.0-flash-exp es el modelo más reciente con capacidades mejoradas
 */
const MODEL_NAME = "gemini-2.0-flash-exp";

// ============================================================================
// SYSTEM PROMPT - MENS ENGINEERING CORE
// ============================================================================

/**
 * System Prompt de Ingeniería para Gemini.
 * Diseñado para forzar respuestas en JSON estricto que cumplan con RoutineDraft.
 * No hay espacio para interpretación - solo datos crudos y medibles.
 */
const SYSTEM_PROMPT = `Eres MENS AI, un motor de ingeniería corporal especializado en diseño de protocolos de entrenamiento. Tu función es generar rutinas de ejercicio basadas en principios biomecánicos y fisiológicos.

REGLAS DE RESPUESTA:
1. SOLO responde con JSON válido. Sin texto adicional, sin explicaciones, sin markdown.
2. El JSON debe seguir EXACTAMENTE esta estructura:

{
  "name": "Nombre de la rutina (string, max 40 chars)",
  "days": [
    {
      "dayIndex": 0,
      "label": "Etiqueta del día (ej: 'Push Day')",
      "exercises": [
        {
          "name": "Nombre del ejercicio",
          "sets": 4,
          "reps": "8-12",
          "restSeconds": 90,
          "order": 0
        }
      ]
    }
  ]
}

CAMPOS OBLIGATORIOS POR EJERCICIO:
- name: string (nombre en español)
- sets: number (3-6 típicamente)
- reps: string ("8-12", "5", "AMRAP", "12-15")
- restSeconds: number (30-180)
- order: number (índice comenzando en 0)

PRINCIPIOS DE DISEÑO:
- Volumen científicamente óptimo: 10-20 series por grupo muscular por semana
- Distribución: ejercicios compuestos primero, aislamiento después
- Progresión: considerar nivel del usuario
- Recovery: no entrenar el mismo músculo en días consecutivos

Si no tienes suficiente información, genera una rutina balanceada de cuerpo completo.

IMPORTANTE: Tu respuesta debe ser PARSEABLE por JSON.parse() directamente.`;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Estructura de respuesta esperada de Gemini (antes de transformación)
 */
interface AIRawExercise {
    name: string;
    sets: number;
    reps: string;
    restSeconds: number;
    order: number;
}

interface AIRawDay {
    dayIndex: number;
    label: string;
    exercises: AIRawExercise[];
}

interface AIRawRoutine {
    name: string;
    days: AIRawDay[];
}

/**
 * Input del usuario para generación de rutina
 */
export interface AIRoutineRequest {
    goal: "strength" | "hypertrophy" | "endurance" | "general";
    daysPerWeek: number;
    level: "beginner" | "intermediate" | "advanced";
    equipment?: "full_gym" | "home" | "bodyweight";
    focusMuscles?: string[];
    additionalNotes?: string;
}

/**
 * Resultado de la generación de IA
 */
export interface AIRoutineResult {
    success: boolean;
    draft?: RoutineDraft;
    rawResponse?: string;
    error?: string;
    latencyMs?: number;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export const AIService = {
    /**
     * Instancia del modelo Gemini (lazy initialization)
     */
    _model: null as GenerativeModel | null,

    /**
     * Obtiene o inicializa el modelo de Gemini
     */
    getModel(): GenerativeModel {
        if (!this._model) {
            if (!GEMINI_API_KEY) {
                throw new Error("[AIService] GEMINI_API_KEY no configurada. Añade EXPO_PUBLIC_GEMINI_API_KEY a tu .env");
            }

            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            this._model = genAI.getGenerativeModel({
                model: MODEL_NAME,
                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 4096,
                },
            });
        }
        return this._model;
    },

    /**
     * Construye el prompt del usuario basado en sus preferencias
     */
    buildUserPrompt(request: AIRoutineRequest): string {
        const goalDescriptions = {
            strength: "fuerza máxima con rangos de 3-6 repeticiones y descansos largos",
            hypertrophy: "hipertrofia muscular con rangos de 8-12 repeticiones",
            endurance: "resistencia muscular con rangos de 15-20 repeticiones y poco descanso",
            general: "fitness general balanceado",
        };

        const levelDescriptions = {
            beginner: "principiante (3-4 ejercicios por día, movimientos fundamentales)",
            intermediate: "intermedio (5-6 ejercicios por día, variedad moderada)",
            advanced: "avanzado (6-8 ejercicios por día, técnicas avanzadas permitidas)",
        };

        const equipmentDescriptions = {
            full_gym: "gimnasio completo con todas las máquinas y peso libre",
            home: "equipamiento casero (mancuernas, bandas, barra)",
            bodyweight: "solo peso corporal",
        };

        let prompt = `Genera una rutina de entrenamiento con las siguientes especificaciones:

OBJETIVO: ${goalDescriptions[request.goal]}
DÍAS POR SEMANA: ${request.daysPerWeek}
NIVEL: ${levelDescriptions[request.level]}
EQUIPAMIENTO: ${equipmentDescriptions[request.equipment || "full_gym"]}`;

        if (request.focusMuscles && request.focusMuscles.length > 0) {
            prompt += `\nÉNFASIS EN: ${request.focusMuscles.join(", ")}`;
        }

        if (request.additionalNotes) {
            prompt += `\nNOTAS ADICIONALES: ${request.additionalNotes}`;
        }

        return prompt;
    },

    /**
     * Transforma la respuesta raw de la IA al formato RoutineDraft
     */
    transformToRoutineDraft(raw: AIRawRoutine): RoutineDraft {
        const days: RoutineDay[] = raw.days.map((day) => {
            const exercises: RoutineExercise[] = day.exercises.map((ex) => {
                // Generar sets como array de PredefinedSet
                const sets: PredefinedSet[] = Array.from({ length: ex.sets }, (_, i) => ({
                    setIndex: i,
                    targetWeight: undefined,
                    targetReps: undefined,
                }));

                return {
                    id: uuidv4(),
                    name: ex.name,
                    sets,
                    reps: ex.reps,
                    restSeconds: ex.restSeconds,
                    order: ex.order,
                };
            });

            return {
                dayIndex: day.dayIndex,
                label: day.label,
                exercises,
            };
        });

        // Asegurar que tenemos 7 días (rellenar vacíos si es necesario)
        const fullDays: RoutineDay[] = Array.from({ length: 7 }, (_, i) => {
            const existingDay = days.find((d) => d.dayIndex === i);
            return existingDay || {
                dayIndex: i,
                label: `Día ${i + 1}`,
                exercises: [],
            };
        });

        return {
            name: raw.name,
            days: fullDays,
        };
    },

    /**
     * Extrae JSON de una respuesta que puede contener markdown
     */
    extractJSON(text: string): string {
        // Intentar extraer JSON de bloques de código markdown
        const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (jsonBlockMatch) {
            return jsonBlockMatch[1].trim();
        }

        // Si no hay bloque de código, asumir que todo es JSON
        return text.trim();
    },

    /**
     * Genera una rutina de entrenamiento usando Gemini
     * Esta es la función principal del servicio
     */
    async generateRoutine(request: AIRoutineRequest): Promise<AIRoutineResult> {
        const startTime = Date.now();

        try {
            const model = this.getModel();
            const userPrompt = this.buildUserPrompt(request);

            console.log("[AIService] Iniciando generación de rutina...");
            console.log("[AIService] Request:", JSON.stringify(request, null, 2));

            // Llamada a Gemini con system prompt
            const result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: SYSTEM_PROMPT },
                            { text: userPrompt },
                        ],
                    },
                ],
            });

            const response = result.response;
            const rawText = response.text();
            const latencyMs = Date.now() - startTime;

            console.log("[AIService] Respuesta recibida en", latencyMs, "ms");
            console.log("[AIService] Raw response:", rawText.substring(0, 500) + "...");

            // Extraer y parsear JSON
            const jsonString = this.extractJSON(rawText);
            let parsed: AIRawRoutine;

            try {
                parsed = JSON.parse(jsonString);
            } catch (parseError) {
                console.error("[AIService] Error parseando JSON:", parseError);
                return {
                    success: false,
                    rawResponse: rawText,
                    error: `Error parseando respuesta de IA: ${parseError}`,
                    latencyMs,
                };
            }

            // Validar estructura mínima
            if (!parsed.name || !Array.isArray(parsed.days)) {
                return {
                    success: false,
                    rawResponse: rawText,
                    error: "Respuesta de IA no contiene campos requeridos (name, days)",
                    latencyMs,
                };
            }

            // Transformar a RoutineDraft
            const draft = this.transformToRoutineDraft(parsed);

            console.log("[AIService] Rutina generada exitosamente:", draft.name);
            console.log("[AIService] Días con ejercicios:", draft.days.filter(d => d.exercises.length > 0).length);

            return {
                success: true,
                draft,
                rawResponse: rawText,
                latencyMs,
            };

        } catch (error) {
            const latencyMs = Date.now() - startTime;
            console.error("[AIService] Error en generateRoutine:", error);

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                latencyMs,
            };
        }
    },

    /**
     * Test de conectividad con Gemini
     * Útil para verificar que la API key funciona
     */
    async testConnection(): Promise<{ success: boolean; message: string; latencyMs: number }> {
        const startTime = Date.now();

        try {
            const model = this.getModel();
            const result = await model.generateContent("Responde solo con: MENS_OK");
            const text = result.response.text();
            const latencyMs = Date.now() - startTime;

            return {
                success: text.includes("MENS_OK") || text.length > 0,
                message: text.trim(),
                latencyMs,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : String(error),
                latencyMs: Date.now() - startTime,
            };
        }
    },
};
