const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { user_name, email, password } = req.body;
    console.log("Dữ liệu nhận được:", req.body)

    try {
        // --- BƯỚC 1: KIỂM TRA ĐẦU VÀO CƠ BẢN ---
        if (!user_name || !password || !email) {
            return res.status(400).json({ error: "Thiếu thông tin đăng ký!" });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "Mật khẩu phải có ít nhất 6 ký tự!" });
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ error: "Email không hợp lệ!" });
        }

        // --- BƯỚC 2: KIỂM TRA EMAIL ĐÃ TỒN TẠI CHƯA ---
        // Chúng ta lấy ra mảng [rows] từ kết quả truy vấn
        const [existingUser] = await db.execute(
            'SELECT email FROM users WHERE email = ?',
            [email]
        );

        // Nếu mảng existingUser có phần tử, nghĩa là email đã tồn tại
        if (existingUser.length > 0) {
            return res.status(400).json({ error: "Email này đã được đăng ký. Vui lòng dùng email khác!" });
        }

        // --- BƯỚC 3: MÃ HÓA MẬT KHẨU VÀ LƯU ---
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            'INSERT INTO users (user_name, email, password, role_user) VALUES (?, ?, ?, ?)',
            [user_name, email, hashedPassword, 'user']
        );

        res.status(201).json({ message: "Đăng ký thành công!" });

    } catch (error) {
        // Bắt các lỗi hệ thống hoặc lỗi kết nối DB
        res.status(500).json({ error: "Đã xảy ra lỗi hệ thống: " + error.message });
    }
};

// authController.js - Hàm login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "User không tồn tại" });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu không đúng" });
        }

        // 👉 CẬP NHẬT Ở ĐÂY: Thêm user_name, email (và phone, id_card nếu DB có) vào token
        const token = jwt.sign(
            { 
                id: user.id, 
                role: user.role_user,
                user_name: user.user_name, // Thêm thông tin này
                email: user.email          // Thêm thông tin này
            },
            'SECRET_KEY',
            { expiresIn: '1h' }
        );

        res.json({
            message: "Đăng nhập thành công",
            token,
            user: {
                id: user.id,
                username: user.user_name,
                role: user.role_user 
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
