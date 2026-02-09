const sql = require("./_db");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "secret123";

module.exports = async function handler(req, res) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "No token" });

    const token = auth.split(" ")[1];
    const user = jwt.verify(token, SECRET);

    const notes = await sql`
      SELECT id, title, content, created_at
      FROM notes
      WHERE user_id=${user.id}
      ORDER BY created_at DESC;
    `;

    res.status(200).json(notes);

  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
