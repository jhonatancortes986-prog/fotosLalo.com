const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

const uploadsDir = path.join(__dirname, 'uploads');
const dbPath = path.join(__dirname, 'database.json');

// Crear carpeta de subidas si no existe
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Inicializar base de datos local con contraseña por defecto: Foto.lalo
if (!fs.existsSync(dbPath)) {
    const initialData = {
        authorPassword: 'Foto.lalo',
        clients: {},
        portfolio: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
}

function readDB() {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (!data.authorPassword) data.authorPassword = 'Foto.lalo';
    return data;
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Almacenamiento Multer (Conserva el archivo original 100% intacto)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueId = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, uniqueId + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 150 * 1024 * 1024 } // Hasta 150 MB por fotografía
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// 1. Iniciar sesión como Autor
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const db = readDB();
    if (password === db.authorPassword) {
        return res.json({ success: true });
    }
    return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
});

// 2. Cambiar contraseña del Autor desde la web
app.post('/api/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const db = readDB();

    if (currentPassword !== db.authorPassword) {
        return res.status(401).json({ success: false, message: 'La contraseña actual no es correcta.' });
    }
    if (!newPassword || newPassword.trim().length < 4) {
        return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 4 caracteres.' });
    }

    db.authorPassword = newPassword.trim();
    writeDB(db);
    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
});

// 3. Subir fotografías de cliente y generar código único
app.post('/api/upload-client', upload.array('photos', 100), (req, res) => {
    const { password, clientName } = req.body;
    const db = readDB();

    if (password !== db.authorPassword) {
        return res.status(401).json({ success: false, message: 'No autorizado.' });
    }
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'Debes seleccionar al menos una imagen.' });
    }

    const code = 'LALO-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const photos = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        url: `/uploads/${file.filename}`
    }));

    db.clients[code] = {
        code,
        clientName: clientName || 'Cliente Lalo.com',
        createdAt: new Date().toLocaleDateString('es-CO'),
        photos
    };

    writeDB(db);
    res.json({ success: true, code, client: db.clients[code] });
});

// 4. Obtener lista de clientes creados (solo para el autor)
app.post('/api/admin/clients', (req, res) => {
    const { password } = req.body;
    const db = readDB();
    if (password !== db.authorPassword) {
        return res.status(401).json({ success: false });
    }
    res.json({ success: true, clients: Object.values(db.clients) });
});

// 5. Eliminar sesión de un cliente (solo autor)
app.post('/api/admin/delete-client', (req, res) => {
    const { password, code } = req.body;
    const db = readDB();
    if (password !== db.authorPassword) {
        return res.status(401).json({ success: false });
    }
    if (db.clients[code]) {
        db.clients[code].photos.forEach(p => {
            const fp = path.join(uploadsDir, p.filename);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        });
        delete db.clients[code];
        writeDB(db);
    }
    res.json({ success: true });
});

// 6. Subir fotos públicas al portafolio
app.post('/api/upload-portfolio', upload.array('photos', 30), (req, res) => {
    const { password, title } = req.body;
    const db = readDB();

    if (password !== db.authorPassword) {
        return res.status(401).json({ success: false, message: 'No autorizado.' });
    }
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'Selecciona imágenes para el portafolio.' });
    }

    req.files.forEach(file => {
        db.portfolio.unshift({
            id: crypto.randomBytes(4).toString('hex'),
            filename: file.filename,
            title: title || 'Producción Publicitaria',
            url: `/uploads/${file.filename}`
        });
    });

    writeDB(db);
    res.json({ success: true });
});

// 7. Obtener portafolio público
app.get('/api/portfolio', (req, res) => {
    const db = readDB();
    res.json({ success: true, portfolio: db.portfolio });
});

// 8. Eliminar foto del portafolio (solo autor)
app.post('/api/admin/delete-portfolio', (req, res) => {
    const { password, id } = req.body;
    const db = readDB();
    if (password !== db.authorPassword) {
        return res.status(401).json({ success: false });
    }
    const index = db.portfolio.findIndex(item => item.id === id);
    if (index !== -1) {
        const fp = path.join(uploadsDir, db.portfolio[index].filename);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
        db.portfolio.splice(index, 1);
        writeDB(db);
    }
    res.json({ success: true });
});

// 9. Consultar galería privada de cliente por código
app.get('/api/client/:code', (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const db = readDB();
    const client = db.clients[code];

    if (!client) {
        return res.status(404).json({ success: false, message: 'El código ingresado no existe o no tiene fotos asignadas.' });
    }
    res.json({ success: true, data: client });
});

// 10. Descarga directa sin recomprimir (Calidad 100% original)
app.get('/api/download/:filename', (req, res) => {
    const filename = path.basename(req.params.filename);
    const originalName = req.query.name || filename;
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath, originalName);
    } else {
        res.status(404).send('Archivo no encontrado.');
    }
});

app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  LALO.COM funcionando en http://localhost:${PORT}`);
    console.log(`==================================================`);
});