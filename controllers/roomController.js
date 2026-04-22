const roomService = require("../services/roomService");

// GET ALL (JOIN room_types)
exports.getAllRooms = async (req, res) => {
    try {
        const result = await roomService.getAllRooms(req.query);
        res.json(result);
    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json({ message: "Lỗi truy vấn", error: err.message });
    }
};

// GET BY ID
exports.getRoomById = async (req, res) => {
    try {
        const room = await roomService.getRoomById(req.params.id);
        if (!room)
            return res.status(404).json({ message: "Không tìm thấy phòng" });

        res.json(room);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// CREATE
exports.createRoom = async (req, res) => {
    try {
        await roomService.createRoom(req.body);
        res.json({ message: "Thêm phòng thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE
exports.updateRoom = async (req, res) => {
    try {
        await roomService.updateRoom({ id: req.params.id, ...req.body });
        res.json({ message: "Cập nhật thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE
exports.deleteRoom = async (req, res) => {
    try {
        await roomService.deleteRoom(req.params.id);
        res.json({ message: "Xóa phòng thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};