const sql = require("./_db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "supersecretkey";

module.exports = async function handler(req, res) {
if (req.method !== "POST")
return res.status(405).json({ error: "Method not allowed" });

try {
const { username, password } = req.body;

if (!username || !password)
  return res.status(400).json({ error: "Username & password required" });

// cari user di db
const users = await sql`
  SELECT * FROM users WHERE username = ${username};
`;

const user = users[0];

if (!user)
  return res.status(400).json({ error: "User tidak ditemukan" });

// bandingkan password hash nya
const valid = await bcrypt.compare(password, user.password);

if (!valid)
  return res.status(400).json({ error: "Password salah" });

// ini yg proses buat token
const token = jwt.sign(
  {
    id: user.id,
    username: user.username,
    name: user.username
  },
  SECRET,
  { expiresIn: "7d" }
);

res.status(200).json({
  success: true,
  token,
  user: {
    id: user.id,
    name: user.username
  }
});

} catch (err) {
res.status(500).json({ error: err.message });
}
};