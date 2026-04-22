const userService = require("../services/userService");

// GET ALL USERS
exports.getUsers = async (req, res) => {
    try {
        const result = await userService.getUsers(req.query);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: "Lỗi truy vấn", error: err.message });
    }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("GET USER BY ID ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// CREATE USER
exports.createUser = async (req, res) => {
    try {
        const result = await userService.createUser(req.body);
        if (result.badRequest) {
            return res.status(400).json({ message: result.badRequest });
        }

        res.status(201).json({
            message: "User created",
            id: result.id,
        });
    } catch (error) {
        console.error("CREATE USER ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
    try {
        const result = await userService.updateUser({ id: req.params.id, ...req.body });
        if (result.notFound) {
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
        const result = await userService.deleteUsertrue(req.params.id);
        if (result.notFound) {
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
        const result = await userService.deleteUser(req.params.id);
        if (result.notFound) {
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
        const result = await userService.resetPassword({
            id: req.params.id,
            newPassword: req.body.newPassword,
        });

        if (result.notFound) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        res.status(200).json({ message: "Đã đặt lại mật khẩu thành công" });
    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi đặt lại mật khẩu" });
    }
};