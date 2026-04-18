const db = require("../db");
const bcrypt = require("bcrypt");

// GET ALL USERS
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const offset = (page - 1) * limit;

        // 1. Chỉ đếm những user có status khác 'deleted'
        const [totalRows] = await db.query(
            "SELECT COUNT(*) as total FROM users "
        );
        const total = totalRows[0].total;

        // 2. Chỉ lấy những user chưa bị xóa
        const [rows] = await db.query(
            `SELECT id, user_name, email, role_user, status_user, created_at 
             FROM users 
             ORDER BY id DESC 
             LIMIT ? OFFSET ?`, 
            [limit, offset]
        );

        res.json({
            data: rows,
            pagination: {
                totalItems: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi truy vấn", error: err.message });
    }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT id, user_name, email, role_user, status_user, created_at FROM users WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("GET USER BY ID ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// CREATE USER
exports.createUser = async (req, res) => {
    try {
        const { user_name, email, password } = req.body;

        if (!user_name || !email || !password) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // check email tồn tại
        const [exist] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (exist.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            "INSERT INTO users (user_name, email, role_user, password) VALUES (?, ?, ?, ?)",
            [user_name, email, 'user', password_hash]
        );

        res.status(201).json({
            message: "User created",
            id: result.insertId,
        });
    } catch (error) {
        console.error("CREATE USER ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_name, email, role_user, status_user } = req.body;

        const [result] = await db.query(
            "UPDATE users SET user_name=?, email=?, role_user=?, status_user=? WHERE id=?",
            [user_name, email, role_user, status_user, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User updated" });
    } catch (error) {
        console.error("UPDATE USER ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE USER
exports.deleteUsertrue = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM users WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted" });
    } catch (error) {
        console.error("DELETE USER ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Thay vì DELETE, ta UPDATE status thành 'deleted'
        const [result] = await db.query(
            "UPDATE users SET status_user = 'deleted' WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        res.status(200).json({ message: "Người dùng đã được đưa vào thùng rác (Soft Delete)" });
    } catch (error) {
        console.error("DELETE USER ERROR:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};
// RESET PASSWORD
exports.resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        // Mã hóa mật khẩu mới
        const password_hash = await bcrypt.hash(newPassword, 10);

        const [result] = await db.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [password_hash, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        res.status(200).json({ message: "Đã đặt lại mật khẩu thành công" });
    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi đặt lại mật khẩu" });
    }
};