const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Encryption key dari environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-this-32bytes!!';
const ALGORITHM = 'aes-256-cbc';

// Path ke file database
const DB_PATH = path.join('/tmp', 'database.enc');

// Fungsi encrypt
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

// Fungsi decrypt
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

// Read database
async function readDB() {
  try {
    const encryptedData = await fs.readFile(DB_PATH, 'utf8');
    const decryptedData = decrypt(encryptedData);
    return JSON.parse(decryptedData);
  } catch (error) {
    return { users: [], notes: [] };
  }
}

// Write database
async function writeDB(data) {
  const jsonData = JSON.stringify(data);
  const encryptedData = encrypt(jsonData);
  await fs.writeFile(DB_PATH, encryptedData, 'utf8');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, dan nama harus diisi' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format email tidak valid' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter' });
  }

  try {
    const db = await readDB();

    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now(),
      email: email,
      password: hashedPassword,
      name: name,
      created_at: new Date().toISOString()
    };

    db.users.push(newUser);
    await writeDB(db);

    return res.status(201).json({ 
      success: true,
      message: 'Registrasi berhasil! Silakan login.' 
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
