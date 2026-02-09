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

    const { title, content } = req.body;

    await sql`
      INSERT INTO notes (user_id, title, content)
      VALUES (${user.id}, ${title}, ${content});
    `;

    res.status(200).json({ message: "Note added" });

  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
