const sql = require("./_db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "secret123";

module.exports = async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { username, password } = req.body;

    const result = await sql`
      SELECT * FROM users WHERE username=${username};
    `;

    if (result.length === 0)
      return res.status(401).json({ error: "User not found" });

    const user = result[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
