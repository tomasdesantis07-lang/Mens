# Instrucciones para Actualizar firebaseConfig.ts

## ⚠️ IMPORTANTE: Debes actualizar tu archivo firebaseConfig.ts manualmente

Tu archivo `src/services/firebaseConfig.ts` está en `.gitignore` por seguridad, así que no puedo editarlo directamente.

## Pasos a seguir:

1. **Abre** `src/services/firebaseConfig.ts`

2. **Verifica que los imports sean exactamente así:**
   ```typescript
   import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
   import { initializeApp } from 'firebase/app';
   // @ts-expect-error - getReactNativePersistence exists at runtime but not in TS definitions
   import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   import { getStorage } from 'firebase/storage';
   ```

   **NOTA**: El comentario `// @ts-expect-error` es necesario porque TypeScript no reconoce `getReactNativePersistence` en las definiciones de tipos, pero la función SÍ existe en runtime para React Native.

3. **Cambia la inicialización de auth de:**
   ```typescript
   export const auth = getAuth(app);
   ```
   
   **A:**
   ```typescript
   export const auth = initializeAuth(app, {
     persistence: getReactNativePersistence(ReactNativeAsyncStorage)
   });
   ```

4. **Guarda el archivo** y recarga la app (presiona `r` en la terminal de Expo)

## ✅ Verificación

Después de hacer estos cambios:
- El warning de AsyncStorage debe desaparecer
- Al cerrar y abrir la app, deberías permanecer logueado
- No deberías ver la pantalla de login nuevamente
- El error de TypeScript desaparecerá gracias al comentario `@ts-expect-error`

## 📝 Referencia

Puedes copiar el contenido completo de `src/services/firebaseConfig.example.ts` y solo reemplazar las credenciales de Firebase con las tuyas.

## 🔍 Solución de Problemas

Si ves el error "Cannot find module 'firebase/auth/react-native'":
- Asegúrate de importar desde `'firebase/auth'` (NO `'firebase/auth/react-native'`)
- Incluye el comentario `// @ts-expect-error` antes del import
- La función existe en runtime aunque TypeScript no la reconozca
