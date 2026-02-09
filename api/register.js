const sql = require("./_db");
const bcrypt = require("bcryptjs");

async function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // ===== VERCEL FIX =====
    const body = await getBody(req);
    const { email, password, name } = body;

    if (!email || !password || !name)
      return res.status(400).json({ error: "Semua field wajib diisi" });

    // cek email sudah ada
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email};
    `;

    if (existing.length > 0)
      return res.status(400).json({ error: "Email sudah terdaftar" });

    // hash password
    const hash = await bcrypt.hash(password, 10);

    // insert user
    await sql`
      INSERT INTO users (email, password, name)
      VALUES (${email}, ${hash}, ${name});
    `;

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
