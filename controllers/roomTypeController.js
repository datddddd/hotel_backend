const db = require('../db');

// GET ALL
exports.getAllRoomTypes = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM room_types ORDER BY id DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET BY ID
exports.getRoomTypeById = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM room_types WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// CREATE
exports.createRoomType = async (req, res) => {
    try {
        const { room_name, price_per_night, max_guests, description, image1, image2 } = req.body;

        await db.query(
            `INSERT INTO room_types (room_name, price_per_night, max_guests, description, image1, image2)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [room_name, price_per_night, max_guests, description, image1, image2]
        );

        res.json({ message: "Thêm thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE
exports.updateRoomType = async (req, res) => {
    try {
        const { room_name, price_per_night, max_guests, description, image1, image2 } = req.body;

        await db.query(
            `UPDATE room_types 
             SET room_name=?, price_per_night=?, max_guests=?, description=?, image1=?, image2=? 
             WHERE id=?`,
            [room_name, price_per_night, max_guests, description, image1, image2, req.params.id]
        );

        res.json({ message: "Cập nhật thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE
exports.deleteRoomType = async (req, res) => {
    try {
        await db.query("DELETE FROM room_types WHERE id=?", [req.params.id]);
        res.json({ message: "Xóa thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};