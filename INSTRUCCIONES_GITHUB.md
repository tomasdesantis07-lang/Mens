# 🚀 Instrucciones para Subir el Proyecto a GitHub

## Paso 1: Crear el Repositorio en GitHub

1. Ve a [GitHub.com](https://github.com) e inicia sesión
2. Haz clic en el botón **"+"** en la esquina superior derecha
3. Selecciona **"New repository"**
4. Configura el repositorio:
   - **Repository name**: `mens-app` (o el nombre que prefieras)
   - **Description**: "Aplicación móvil de entrenamiento y disciplina"
   - **Visibility**: 
     - ✅ **Private** (recomendado para proyectos con credenciales)
     - ⚠️ Public (solo si estás seguro de que no hay datos sensibles)
   - **NO** marques "Initialize this repository with a README" (ya tienes uno)
5. Haz clic en **"Create repository"**

## Paso 2: Conectar tu Proyecto Local con GitHub

GitHub te mostrará instrucciones. Usa estas (reemplaza `<TU_USUARIO>` con tu usuario de GitHub):

```bash
git remote add origin https://github.com/<TU_USUARIO>/mens-app.git
git branch -M main
git push -u origin main
```

**Ejemplo:**
```bash
git remote add origin https://github.com/tomasdesantis07/mens-app.git
git branch -M main
git push -u origin main
```

## Paso 3: Verificar que se Subió Correctamente

1. Refresca la página de tu repositorio en GitHub
2. Deberías ver todos tus archivos
3. Verifica que **NO** aparezca `src/services/firebaseConfig.ts` (está protegido por .gitignore)

## Paso 4: Invitar a tu Socio como Colaborador

### En GitHub:

1. Ve a tu repositorio en GitHub
2. Haz clic en **"Settings"** (configuración)
3. En el menú lateral, haz clic en **"Collaborators"**
4. Haz clic en **"Add people"**
5. Ingresa el **username** o **email** de tu socio
6. Selecciona el nivel de acceso:
   - **Write**: Puede hacer push directamente (recomendado para socios)
   - **Admin**: Control total del repositorio
7. Haz clic en **"Add [nombre] to this repository"**

Tu socio recibirá un email de invitación.

## Paso 5: Compartir las Credenciales de Firebase

**⚠️ IMPORTANTE**: Las credenciales de Firebase NO están en el repositorio por seguridad.

Debes compartir las credenciales de forma segura con tu socio:

### Opción 1: Mensaje Privado Seguro
Envía el contenido del archivo `src/services/firebaseConfig.ts` por un canal seguro (WhatsApp, Telegram, email cifrado, etc.)

### Opción 2: Compartir Acceso a Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto "mens-app-19d42"
3. Haz clic en el ícono de engranaje ⚙️ → **"Project settings"**
4. Ve a la pestaña **"Users and permissions"**
5. Haz clic en **"Add member"**
6. Ingresa el email de Google de tu socio
7. Asigna el rol **"Editor"** o **"Owner"**

De esta forma, tu socio podrá obtener las credenciales directamente desde Firebase.

## Paso 6: Instrucciones para tu Socio

Comparte este mensaje con tu socio:

---

### 📥 Cómo Clonar y Configurar el Proyecto

1. **Acepta la invitación de GitHub** (revisa tu email)

2. **Clona el repositorio**:
   ```bash
   git clone https://github.com/<TU_USUARIO>/mens-app.git
   cd mens-app
   ```

3. **Instala las dependencias**:
   ```bash
   npm install
   ```

4. **Configura Firebase**:
   - Copia el archivo de ejemplo:
     ```bash
     copy src\services\firebaseConfig.example.ts src\services\firebaseConfig.ts
     ```
   - Solicítame las credenciales de Firebase
   - Edita `src/services/firebaseConfig.ts` con las credenciales reales

5. **Inicia la app**:
   ```bash
   npm start
   ```

6. **Lee la documentación**:
   - `README.md` - Información general del proyecto
   - `COLABORACION.md` - Guía de colaboración y estándares de código

7. **Configura Antigravity**:
   - Abre Antigravity (Google AI Studio o tu IDE)
   - Abre la carpeta del proyecto
   - ¡Listo para colaborar! 🎉

---

## Comandos Útiles para Colaboración

### Actualizar tu código con los cambios del equipo:
```bash
git pull origin main
```

### Crear una nueva feature:
```bash
git checkout -b feature/mi-funcionalidad
# ... haz cambios ...
git add .
git commit -m "feat: descripción del cambio"
git push origin feature/mi-funcionalidad
```

### Ver el estado de tu repositorio:
```bash
git status
```

### Ver el historial de commits:
```bash
git log --oneline -10
```

## 🔒 Seguridad

### Archivos que NUNCA deben subirse a Git:
- ✅ `src/services/firebaseConfig.ts` (ya protegido en .gitignore)
- ✅ `.env` y variantes (ya protegido)
- ✅ `node_modules/` (ya protegido)
- ✅ Archivos de build (ya protegido)

### Si accidentalmente subiste credenciales:

1. **Cambia las credenciales inmediatamente** en Firebase Console
2. **Elimina el archivo del historial de Git**:
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch src/services/firebaseConfig.ts" \
   --prune-empty --tag-name-filter cat -- --all
   ```
3. **Fuerza el push**:
   ```bash
   git push origin --force --all
   ```

## 📞 Soporte

Si tu socio tiene problemas:

1. Verifica que aceptó la invitación de GitHub
2. Verifica que tiene las credenciales correctas de Firebase
3. Verifica que instaló todas las dependencias (`npm install`)
4. Lee la sección de Troubleshooting en `README.md`

---

## ✅ Checklist Final

- [ ] Repositorio creado en GitHub
- [ ] Código subido correctamente
- [ ] `firebaseConfig.ts` NO aparece en GitHub
- [ ] Socio invitado como colaborador
- [ ] Credenciales de Firebase compartidas de forma segura
- [ ] Socio puede clonar y ejecutar el proyecto
- [ ] Ambos pueden ver el proyecto en Antigravity

¡Listo para colaborar! 🚀
