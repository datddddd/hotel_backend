const db = require('../db');

// GET ALL (JOIN room_types)
exports.getAllRooms = async (req, res) => {
    try {
        // Lấy tham số từ query string (mặc định trang 1, mỗi trang 6 item)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const offset = (page - 1) * limit;

        // 1. Lấy tổng số lượng bản ghi để tính tổng số trang
        const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM room");

        // 2. Lấy dữ liệu có phân trang
        const [rows] = await db.query(`
            SELECT r.*, rt.room_name, rt.price_per_night 
            FROM room r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            ORDER BY r.id DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        res.json({
            data: rows,
            pagination: {
                totalItems: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                limit: limit
            }
        });
    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json({ message: "Lỗi truy vấn", error: err.message });
    }
};

// GET BY ID
exports.getRoomById = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM room WHERE id = ?",
            [req.params.id]
        );
        if (rows.length === 0)
            return res.status(404).json({ message: "Không tìm thấy phòng" });

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// CREATE
exports.createRoom = async (req, res) => {
    try {
        const { room_number, room_type_id, status } = req.body;

        await db.query(
            `INSERT INTO room (room_number, room_type_id, status)
             VALUES (?, ?, ?)`,
            [room_number, room_type_id, status || 'available']
        );

        res.json({ message: "Thêm phòng thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE
exports.updateRoom = async (req, res) => {
    try {
        const { room_number, room_type_id, status } = req.body;

        await db.query(
            `UPDATE room 
             SET room_number=?, room_type_id=?, status=? 
             WHERE id=?`,
            [room_number, room_type_id, status, req.params.id]
        );

        res.json({ message: "Cập nhật thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE
exports.deleteRoom = async (req, res) => {
    try {
        await db.query("DELETE FROM room WHERE id=?", [req.params.id]);
        res.json({ message: "Xóa phòng thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};