# LALO.COM — primera versión funcional

Incluye sitio público, acceso de administrador, creación de galerías privadas mediante enlaces aleatorios, carga múltiple de fotos y descarga de archivos originales.

## Requisitos
- PHP 8.1 o superior con extensiones PDO MySQL, Fileinfo y GD (para validar imágenes).
- MySQL 5.7+ o MariaDB equivalente.
- Servidor Apache con mod_rewrite/AllowOverride habilitado para respetar `storage/.htaccess`.
- HTTPS obligatorio en producción.

## Instalación local (XAMPP)
1. Copia la carpeta `LALO_COM` dentro de `C:\xampp\htdocs\`.
2. Inicia Apache y MySQL desde XAMPP.
3. Abre phpMyAdmin e importa `schema.sql`.
4. Revisa `config/database.php`. Por defecto usa base `lalo_com`, usuario `root` y contraseña vacía (configuración típica local de XAMPP; cámbiala si tu instalación es distinta).
5. Asegúrate de que PHP permite cargas de al menos 50 MB. En `php.ini`, revisa `upload_max_filesize = 50M`, `post_max_size = 300M` y `max_file_uploads`.
6. Abre `http://localhost/LALO_COM/setup.php`, crea el administrador y después **elimina `setup.php`**.
7. Entra en `http://localhost/LALO_COM/admin/login.php`.
8. Crea una galería, selecciona fotos y comparte el enlace privado que se genera.

## Estructura
- `index.php`: página pública.
- `assets/css/style.css`: estilos.
- `assets/js/main.js`: JavaScript del formulario.
- `config/`: conexión y control de sesión/CSRF.
- `admin/`: inicio de sesión, panel y carga de archivos.
- `clientes/`: galería, vista previa y descarga.
- `storage/originals/`: archivos originales. No publiques esta carpeta ni elimines su `.htaccess`.

## Seguridad y límites importantes
- Los enlaces de galería son secretos: compártelos solo con el cliente. Cualquiera que tenga el enlace puede entrar.
- Esta versión tiene un único rol de administrador; no hay cuentas individuales para clientes.
- Se aceptan JPG, PNG y WebP de hasta 50 MB por archivo. No se convierten, redimensionan ni recomprimen al guardarse.
- Los formatos RAW de cámaras (CR2, CR3, NEF, ARW, DNG, etc.) todavía no están habilitados; requieren validación, almacenamiento y descarga específicos.
- Configura HTTPS, credenciales fuertes, copias de seguridad y límites de subida en el hosting antes de publicar.
- Para producción, lo ideal es almacenar los originales fuera del directorio público y servirlos únicamente mediante PHP autenticado. El `.htaccess` incluido bloquea acceso directo en Apache, pero debes verificarlo en tu hosting.
- La página de inicio usa una fotografía remota de Unsplash como imagen decorativa; reemplázala por una imagen propia si lo deseas.
