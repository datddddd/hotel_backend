const db = require("../db");

const getUserByEmail = async (email) => {
  const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0] || null;
};

const createUser = async ({ user_name, email, password, role_user }) => {
  await db.execute(
    "INSERT INTO users (user_name, email, password, role_user) VALUES (?, ?, ?, ?)",
    [user_name, email, password, role_user]
  );
};

const updatePassword = async (email, newPassword) => {
  await db.execute("UPDATE users SET password = ? WHERE email = ?", [newPassword, email]);
};

const getUserById = async (id) => {
  const [rows] = await db.execute("SELECT id, user_name, email, role_user, status_user FROM users WHERE id = ?", [id]);
  return rows[0] || null;
};

const updateProfile = async (id, { user_name, email }) => {
  await db.execute("UPDATE users SET user_name = ?, email = ? WHERE id = ?", [user_name, email, id]);
};

module.exports = {
  getUserByEmail,
  createUser,
  updatePassword,
  getUserById,
  updateProfile,
};
