const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

const uploadsDir = path.join(__dirname, 'uploads');
const dbPath = path.join(__dirname, 'database.json');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Inicializar base de datos sin contraseña (vacía para que tú la configures)
if (!fs.existsSync(dbPath)) {
    const initialData = {
        authorPassword: '',
        clients: {},
        portfolio: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
}

function readDB() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Multer: Guarda la foto con calidad intacta (sin compresión)
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
    limits: { fileSize: 200 * 1024 * 1024 } // Soporta archivos pesados de cámaras profesionales (hasta 200MB)
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Comprobar si hay contraseña configurada
app.get('/api/check-password-status', (req, res) => {
    const db = readDB();
    res.json({ success: true, hasPassword: !!db.authorPassword && db.authorPassword.trim() !== '' });
});

// Configurar o cambiar contraseña
app.post('/api/set-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const db = readDB();

    if (db.authorPassword && db.authorPassword.trim() !== '' && currentPassword !== db.authorPassword) {
        return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta.' });
    }

    if (!newPassword || newPassword.trim().length < 3) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 3 caracteres.' });
    }

    db.authorPassword = newPassword.trim();
    writeDB(db);
    res.json({ success: true, message: '¡Contraseña guardada correctamente!' });
});

// Iniciar sesión de autor
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const db = readDB();
    if (!db.authorPassword) {
        return res.status(400).json({ success: false, message: 'Aún no has configurado una contraseña. Establécela primero.' });
    }
    if (password === db.authorPassword) {
        return res.json({ success: true });
    }
    return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
});

// Subir fotos de cliente y generar código único
app.post('/api/upload-client', upload.array('photos', 100), (req, res) => {
    const { password, clientName } = req.body;
    const db = readDB();

    if (password !== db.authorPassword) {
        return res.status(401).json({ success: false, message: 'No autorizado.' });
    }
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'Selecciona al menos una foto.' });
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
    res.json({ success: true, code });
});

// Listar clientes para autor
app.post('/api/admin/clients', (req, res) => {
    const { password } = req.body;
    const db = readDB();
    if (password !== db.authorPassword) return res.status(401).json({ success: false });
    res.json({ success: true, clients: Object.values(db.clients) });
});

// Eliminar cliente
app.post('/api/admin/delete-client', (req, res) => {
    const { password, code } = req.body;
    const db = readDB();
    if (password !== db.authorPassword) return res.status(401).json({ success: false });
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

// Subir fotos al portafolio público
app.post('/api/upload-portfolio', upload.array('photos', 30), (req, res) => {
    const { password, title } = req.body;
    const db = readDB();
    if (password !== db.authorPassword) return res.status(401).json({ success: false, message: 'No autorizado.' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false });

    req.files.forEach(file => {
        db.portfolio.unshift({
            id: crypto.randomBytes(4).toString('hex'),
            filename: file.filename,
            title: title || 'Trabajo Publicitario',
            url: `/uploads/${file.filename}`
        });
    });

    writeDB(db);
    res.json({ success: true });
});

// Obtener portafolio
app.get('/api/portfolio', (req, res) => {
    const db = readDB();
    res.json({ success: true, portfolio: db.portfolio });
});

// Eliminar foto del portafolio
app.post('/api/admin/delete-portfolio', (req, res) => {
    const { password, id } = req.body;
    const db = readDB();
    if (password !== db.authorPassword) return res.status(401).json({ success: false });
    const index = db.portfolio.findIndex(item => item.id === id);
    if (index !== -1) {
        const fp = path.join(uploadsDir, db.portfolio[index].filename);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
        db.portfolio.splice(index, 1);
        writeDB(db);
    }
    res.json({ success: true });
});

// Ver fotos de cliente mediante código
app.get('/api/client/:code', (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const db = readDB();
    const client = db.clients[code];
    if (!client) return res.status(404).json({ success: false, message: 'Código no válido o inexistente.' });
    res.json({ success: true, data: client });
});

// Descarga en calidad original exacta
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
    console.log(`Servidor de LALO.COM corriendo en http://localhost:${PORT}`);
});