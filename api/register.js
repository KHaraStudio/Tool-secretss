const sql = require("./_db");
const bcrypt = require("bcryptjs");

module.exports = async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {

    // ⭐ FIX BODY PARSE
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const { username, password } = body;

    if (!username || !password)
      return res.status(400).json({ error: "Username & password required" });

    const hash = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO users (username, password)
      VALUES (${username}, ${hash});
    `;

    res.status(200).json({ message: "User created" });

  } catch (err) {
    console.log("REGISTER ERROR:", err); // penting buat debug

    if (err.message && err.message.includes("duplicate"))
      return res.status(400).json({ error: "Username already exists" });

    res.status(500).json({ error: "Internal server error" });
  }
};
