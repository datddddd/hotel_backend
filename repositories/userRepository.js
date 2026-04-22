const db = require("../db");

const countUsers = async () => {
  const [rows] = await db.query("SELECT COUNT(*) as total FROM users ");
  return rows[0].total;
};

const getUsers = async ({ limit, offset }) => {
  const [rows] = await db.query(
    `SELECT id, user_name, email, role_user, status_user, created_at
     FROM users
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
};

const getUserById = async (id) => {
  const [rows] = await db.query(
    "SELECT id, user_name, email, role_user, status_user, created_at FROM users WHERE id = ?",
    [id]
  );
  return rows[0] || null;
};

const getUserByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0] || null;
};

const createUser = async ({ user_name, email, role_user, password }) => {
  const [result] = await db.query(
    "INSERT INTO users (user_name, email, role_user, password) VALUES (?, ?, ?, ?)",
    [user_name, email, role_user, password]
  );
  return result.insertId;
};

const updateUser = async ({ id, user_name, email, role_user, status_user }) => {
  const [result] = await db.query(
    "UPDATE users SET user_name=?, email=?, role_user=?, status_user=? WHERE id=?",
    [user_name, email, role_user, status_user, id]
  );
  return result.affectedRows;
};

const deleteUserHard = async (id) => {
  const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);
  return result.affectedRows;
};

const deleteUserSoft = async (id) => {
  const [result] = await db.query(
    "UPDATE users SET status_user = 'deleted' WHERE id = ?",
    [id]
  );
  return result.affectedRows;
};

const updatePassword = async ({ id, password }) => {
  const [result] = await db.query(
    "UPDATE users SET password = ? WHERE id = ?",
    [password, id]
  );
  return result.affectedRows;
};

module.exports = {
  countUsers,
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUserHard,
  deleteUserSoft,
  updatePassword,
};
