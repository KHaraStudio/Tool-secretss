const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-this-32bytes!!';
const ALGORITHM = 'aes-256-cbc';
const DB_PATH = path.join('/tmp', 'database.enc');

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = parts.join(':');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

async function readDB() {
  try {
    const encryptedData = await fs.readFile(DB_PATH, 'utf8');
    const decryptedData = decrypt(encryptedData);
    return JSON.parse(decryptedData);
  } catch (error) {
    return { users: [], notes: [] };
  }
}

async function writeDB(data) {
  const jsonData = JSON.stringify(data);
  const encryptedData = encrypt(jsonData);
  await fs.writeFile(DB_PATH, encryptedData, 'utf8');
}

const verifyToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token tidak valid');
  }
  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decoded = verifyToken(req.headers.authorization);
    const userId = decoded.userId;

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID catatan diperlukan' });
    }

    const db = await readDB();

    const noteIndex = db.notes.findIndex(note => note.id === id && note.user_id === userId);

    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Catatan tidak ditemukan' });
    }

    db.notes.splice(noteIndex, 1);
    await writeDB(db);

    return res.status(200).json({
      success: true,
      message: 'Catatan berhasil dihapus'
    });

  } catch (error) {
    console.error('Error:', error);
    if (error.name === 'JsonWebTokenError' || error.message === 'Token tidak valid') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
