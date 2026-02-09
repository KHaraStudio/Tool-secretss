const sql = require("./_db");
const bcrypt = require("bcryptjs");

module.exports = async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: "Username & password required" });

    const hash = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO users (username, password)
      VALUES (${username}, ${hash});
    `;

    res.status(200).json({ message: "User created" });

  } catch (err) {
    if (err.message.includes("duplicate"))
      return res.status(400).json({ error: "Username already exists" });

    res.status(500).json({ error: err.message });
  }
};
