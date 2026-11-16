const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const AUTHOR_PASSWORD = 'Foto.lalo';

// Asegurar que existan las carpetas y la base de datos local
const uploadsDir = path.join(__dirname, 'uploads');
const dbPath = path.join(__dirname, 'database.json');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ clients: {}, portfolio: [] }, null, 2));
}

function readDB() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Configuración de almacenamiento Multer (Mantiene calidad y archivo 100% original)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // Límite de 100MB por fotografía RAW/JPG de alta resolución
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// 1. Verificar contraseña del autor
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === AUTHOR_PASSWORD) {
        return res.json({ success: true });
    }
    return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
});

// 2. Subir fotos de cliente y generar código único
app.post('/api/upload-client', upload.array('photos', 50), (req, res) => {
    const { password, clientName } = req.body;
    if (password !== AUTHOR_PASSWORD) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No se seleccionaron archivos' });
    }

    const db = readDB();
    // Generar código único estilo LALO-XXXX
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    const accessCode = `LALO-${randomPart}`;

    const photosData = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        url: `/uploads/${file.filename}`
    }));

    db.clients[accessCode] = {
        clientName: clientName || 'Cliente Lalo.com',
        createdAt: new Date().toLocaleDateString('es-CO'),
        photos: photosData
    };

    writeDB(db);
    res.json({ success: true, code: accessCode, count: photosData.length });
});

// 3. Subir fotos públicas de referencia (Portafolio)
app.post('/api/upload-portfolio', upload.array('photos', 20), (req, res) => {
    const { password, title } = req.body;
    if (password !== AUTHOR_PASSWORD) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No se seleccionaron archivos' });
    }

    const db = readDB();
    req.files.forEach(file => {
        db.portfolio.unshift({
            title: title || 'Producción Lalo.com',
            url: `/uploads/${file.filename}`
        });
    });

    writeDB(db);
    res.json({ success: true });
});

// 4. Obtener galería pública de referencia
app.get('/api/portfolio', (req, res) => {
    const db = readDB();
    res.json({ success: true, portfolio: db.portfolio });
});

// 5. Consultar galería privada de cliente mediante código
app.get('/api/client/:code', (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const db = readDB();
    const clientData = db.clients[code];

    if (!clientData) {
        return res.status(404).json({ success: false, message: 'Código no válido o sin fotografías asignadas.' });
    }

    res.json({ success: true, data: clientData });
});

// 6. Descarga forzada en calidad 100% original (sin alteración del navegador)
app.get('/api/download/:filename', (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath, filename);
    } else {
        res.status(404).send('Archivo no encontrado');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor LALO.COM ejecutándose en http://localhost:${PORT}`);
});