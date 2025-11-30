# Configuración de Git para este Proyecto

## Estado Actual
✅ Git está instalado en: `C:\Program Files\Git\cmd`
✅ Repositorio inicializado
✅ Commit inicial realizado
✅ `.gitignore` configurado

## Para usar Git normalmente

### Opción 1: Reiniciar VS Code (RECOMENDADO)
1. Cierra completamente VS Code
2. Abre VS Code de nuevo
3. Ahora `git` debería funcionar normalmente

### Opción 2: Usar la ruta completa (temporal)
Si no quieres reiniciar, usa:
```powershell
& "C:\Program Files\Git\cmd\git.exe" <comando>
```

## Próximos Pasos para GitHub

Una vez que `git` funcione, ejecuta:

```powershell
# Verificar que git funciona
git --version

# Agregar el repositorio remoto
git remote add origin https://github.com/tomasdesantis07-lang/Mens.git

# Cambiar a la rama main
git branch -M main

# Subir los cambios
git push -u origin main
```

## Configuración de Usuario (Ya configurada localmente)
```powershell
# Para cambiar el usuario si lo necesitas:
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# Para configurarlo globalmente (todos los proyectos):
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

## Comandos Útiles
```powershell
# Ver el estado
git status

# Ver el historial
git log --oneline

# Ver archivos ignorados
git status --ignored
```
