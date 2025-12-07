# Guía de Colaboración - MENS App

## 🎯 Bienvenido al Equipo

Esta guía te ayudará a empezar a trabajar en el proyecto MENS App.

## 📥 Setup Inicial

### 1. Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd mens-app
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Firebase

**IMPORTANTE**: El archivo de configuración de Firebase NO está en el repositorio por seguridad.

1. Copia el archivo de ejemplo:
   ```bash
   cp src/services/firebaseConfig.example.ts src/services/firebaseConfig.ts
   ```

2. Solicita las credenciales de Firebase al administrador del proyecto

3. Edita `src/services/firebaseConfig.ts` y reemplaza los valores de ejemplo con las credenciales reales

4. **NUNCA** hagas commit de este archivo (ya está en `.gitignore`)

### 4. Ejecutar la App

```bash
npm start
```

## 🔄 Workflow de Git

### Estructura de Branches

- `main` - Código en producción (protegida)
- `develop` - Desarrollo activo
- `feature/nombre-feature` - Nuevas funcionalidades
- `fix/nombre-bug` - Corrección de bugs
- `refactor/nombre` - Refactorización

### Proceso de Desarrollo

1. **Actualiza tu repositorio local**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Crea una nueva rama desde main**
   ```bash
   git checkout -b feature/mi-nueva-funcionalidad
   ```

3. **Desarrolla tu feature**
   - Haz commits pequeños y frecuentes
   - Usa mensajes descriptivos

4. **Commit de cambios**
   ```bash
   git add .
   git commit -m "feat: descripción clara del cambio"
   ```

5. **Sube tu rama**
   ```bash
   git push origin feature/mi-nueva-funcionalidad
   ```

6. **Crea un Pull Request**
   - Ve a GitHub
   - Crea un PR de tu rama hacia `main`
   - Describe los cambios realizados
   - Solicita revisión de código

7. **Después de la aprobación**
   - Haz merge del PR
   - Elimina la rama remota
   - Actualiza tu repositorio local

### Convenciones de Commits

Usa prefijos para categorizar tus commits:

- `feat:` - Nueva funcionalidad
  ```
  feat: añadir pantalla de estadísticas de usuario
  ```

- `fix:` - Corrección de bugs
  ```
  fix: corregir cálculo de racha de entrenamiento
  ```

- `refactor:` - Refactorización sin cambiar funcionalidad
  ```
  refactor: simplificar lógica de WorkoutService
  ```

- `style:` - Cambios de formato/estilo
  ```
  style: formatear componentes con prettier
  ```

- `docs:` - Documentación
  ```
  docs: actualizar README con instrucciones de deployment
  ```

- `test:` - Añadir o modificar tests
  ```
  test: añadir tests para RoutineService
  ```

- `chore:` - Tareas de mantenimiento
  ```
  chore: actualizar dependencias
  ```

## 📝 Estándares de Código

### TypeScript

- Siempre usa tipos explícitos
- Evita `any`, usa tipos específicos o `unknown`
- Define interfaces para objetos complejos

### Componentes React

- Un componente por archivo
- Usa TypeScript para props
- Prefiere functional components con hooks
- Usa nombres descriptivos

Ejemplo:
```typescript
interface WorkoutCardProps {
  workout: Workout;
  onPress: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onPress }) => {
  // ...
};
```

### Estilos

- Usa StyleSheet.create()
- Agrupa estilos relacionados
- Usa constantes para colores y espaciados

### Traducciones

- NUNCA uses texto hardcodeado
- Siempre usa `useTranslation` hook
- Añade traducciones en `src/locales/es.json` y `src/locales/en.json`

```typescript
const { t } = useTranslation();

// ❌ Incorrecto
<Text>Entrenar</Text>

// ✅ Correcto
<Text>{t('workout.train')}</Text>
```

## 🏗️ Arquitectura del Proyecto

### Organización de Carpetas

```
src/
├── components/
│   ├── common/          # Botones, inputs, cards genéricos
│   ├── specific/        # Componentes específicos del dominio
│   ├── profile/         # Componentes del perfil
│   └── workout/         # Componentes de entrenamiento
├── services/            # Lógica de negocio y Firebase
├── hooks/               # Custom hooks reutilizables
├── types/               # TypeScript types e interfaces
├── utils/               # Funciones utilitarias
└── locales/             # Archivos de traducción
```

### Servicios

Los servicios manejan la lógica de negocio y comunicación con Firebase:

- `AuthService.ts` - Autenticación
- `UserService.ts` - Gestión de usuarios
- `RoutineService.ts` - Gestión de rutinas
- `WorkoutService.ts` - Registro de entrenamientos

### Tipos

Define todos los tipos en `src/types/`:

- `exercise.ts` - Tipos relacionados con ejercicios
- `routine.ts` - Tipos de rutinas
- `workout.ts` - Tipos de entrenamientos
- `user.ts` - Tipos de usuario

## 🧪 Testing

Antes de hacer commit:

1. **Verifica que la app compile**
   ```bash
   npm start
   ```

2. **Ejecuta el linter**
   ```bash
   npm run lint
   ```

3. **Prueba en dispositivo real**
   - Abre Expo Go
   - Escanea el QR
   - Prueba tu funcionalidad

## 🐛 Debugging

### Logs

Usa console.log para debugging temporal (elimínalos antes del commit):

```typescript
console.log('[WorkoutService] Saving workout:', workout);
```

### React Native Debugger

1. Presiona `j` en la terminal de Expo
2. Abre Chrome DevTools
3. Usa breakpoints y console

### Errores Comunes

**Error: "Firebase not initialized"**
- Verifica que `firebaseConfig.ts` exista y tenga las credenciales correctas

**Error: "Cannot find module"**
- Ejecuta `npm install`
- Reinicia el servidor: `npm start -- --clear`

**Cambios no se reflejan**
- Presiona `r` en la terminal para reload
- Cierra y reabre Expo Go

## 📞 Comunicación

### Canales

- **GitHub Issues**: Para bugs y features
- **Pull Requests**: Para revisión de código
- **[Tu canal preferido]**: Para comunicación diaria

### Reportar Bugs

Al reportar un bug, incluye:

1. Descripción del problema
2. Pasos para reproducir
3. Comportamiento esperado vs actual
4. Screenshots si aplica
5. Versión de la app y dispositivo

### Proponer Features

Al proponer una feature:

1. Describe el problema que resuelve
2. Propón una solución
3. Considera alternativas
4. Estima complejidad

## 🚀 Deployment

[Instrucciones de deployment cuando estén definidas]

## 📚 Recursos Útiles

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## ✅ Checklist antes de Pull Request

- [ ] El código compila sin errores
- [ ] No hay warnings del linter
- [ ] Probado en dispositivo real
- [ ] Traducciones añadidas (ES e EN)
- [ ] Código comentado donde sea necesario
- [ ] No hay console.logs de debugging
- [ ] Commit messages siguen convenciones
- [ ] Branch actualizada con main

---

¡Bienvenido al equipo! 🎉
