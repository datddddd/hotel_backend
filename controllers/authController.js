const authService = require("../services/authService");

exports.register = async (req, res) => {
    try {
        const result = await authService.register(req.body);
        if (result.badRequest) {
            return res.status(400).json({ error: result.badRequest });
        }

        res.status(201).json({ message: "Đăng ký thành công!" });

    } catch (error) {
        // Bắt các lỗi hệ thống hoặc lỗi kết nối DB
        res.status(500).json({ error: "Đã xảy ra lỗi hệ thống: " + error.message });
    }
};

// authController.js - Hàm login
exports.login = async (req, res) => {
    try {
        const result = await authService.login(req.body);
        if (result.notFound) {
            return res.status(404).json({ message: "User không tồn tại" });
        }
        if (result.invalidPassword) {
            return res.status(401).json({ message: "Mật khẩu không đúng" });
        }

        res.json({
            message: "Đăng nhập thành công",
            token: result.token,
            user: result.user
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
