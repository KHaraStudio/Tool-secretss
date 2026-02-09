const sql = require("./_db");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "secret123";

module.exports = async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "No token" });

    const token = auth.split(" ")[1];
    const user = jwt.verify(token, SECRET);

    const { id } = req.body;

    await sql`
      DELETE FROM notes
      WHERE id=${id} AND user_id=${user.id};
    `;

    res.status(200).json({ message: "Note deleted" });

  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
