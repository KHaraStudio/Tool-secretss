const sql = require("./_db");
const getUser = require("./_auth");

module.exports = async function handler(req, res) {
if (req.method !== "POST")
return res.status(405).json({ error: "Method not allowed" });

try {
const user = getUser(req);

if (!user)
  return res.status(401).json({ error: "Unauthorized" });

const { day, note_text, description } = req.body;

if (!day || !note_text)
  return res.status(400).json({ error: "Data tidak lengkap" });

const result = await sql`
  INSERT INTO notes (user_id, day, note_text, description)
  VALUES (${user.id}, ${day}, ${note_text}, ${description || null})
  RETURNING *;
`;

res.status(200).json({
  success: true,
  note: result[0]
});

} catch (err) {
res.status(500).json({ error: err.message });
}
};