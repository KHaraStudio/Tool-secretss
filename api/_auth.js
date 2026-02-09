const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "supersecretkey";

module.exports = function getUser(req) {
try {
const header = req.headers.authorization || req.headers.Authorization;
if (!header) return null;

const parts = header.split(" ");
if (parts.length !== 2) return null;

const token = parts[1];

const decoded = jwt.verify(token, SECRET);
return decoded;

} catch (err) {
return null;
}
};