# ProyectoDAM
Repositorio dedicado al proyecto de fin de grado de 2ºDAM

## PASOS PARA LA EJECUCIÓN DEL PROYECTO (por el momento)
1. Abrir el CMD (más comodo).
2. Desplazarse a la carpeta client.
3. Ejecutar npm install.
4. Ejecutar npx ng serve.

- [x] Default
- [ ] Usability improvement
- [ ] BBDD SQL
- [ ] BBDD NoSQL
- [ ] Sockets Connection


# Guía de Configuración del Entorno de Desarrollo (Backend)

Este documento detalla los pasos necesarios para configurar las herramientas requeridas y poner en marcha el servidor de desarrollo.

---

## 1. Instalar Apache Maven

1. **Descarga**: Ve a [maven.apache.org/download.cgi](https://maven.apache.org/download.cgi).
2. **Selección**: Descarga el archivo `apache-maven-3.x.x-bin.zip` (asegúrate de elegir la versión más reciente, por ejemplo, 3.9.x).
3. **Extracción**: Extrae el contenido del ZIP en una carpeta local, por ejemplo: `C:\maven` (crea la carpeta si no existe).
4. **Configuración de Variables de Entorno**:
   - Busca **"Variables de entorno"** en el menú Inicio de Windows.
   - En la sección **Variables del sistema**, busca la variable llamada `Path` y selecciona "Editar".
   - Añade una nueva entrada con la ruta: `C:\maven\bin`.
5. **Refrescar Terminal**: Reinicia PowerShell o, si tienes Chocolatey, ejecuta `refreshenv` en la terminal.
6. **Verificación**: Ejecuta el siguiente comando para confirmar la instalación:
   ```bash
   mvn --version

Puerto 3307 MySQL
Puerto 27017 MongoDB

```bash
cd C:\ProyectoDAM\backend
mvn spring-boot:run
```

```bash
cd C:\ProyectoDAM\frontend
npm start
```
