const roomTypeService = require("../services/roomTypeService");

// GET ALL
exports.getAllRoomTypes = async (req, res) => {
    try {
        const rows = await roomTypeService.getAllRoomTypes();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// SEARCH — tìm kiếm tương đối bằng 1 từ khóa duy nhất
// Dùng image1/image2 ngay trên room_types, JOIN room để đếm phòng trống
exports.searchRoomTypes = async (req, res) => {
    try {
        const result = await roomTypeService.searchRoomTypes(req.query.keyword);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET BY ID
exports.getRoomTypeById = async (req, res) => {
    try {
        const roomType = await roomTypeService.getRoomTypeById(req.params.id);
        if (!roomType) return res.status(404).json({ message: "Không tìm thấy" });
        res.json(roomType);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// CREATE
exports.createRoomType = async (req, res) => {
    try {
        await roomTypeService.createRoomType({ body: req.body, files: req.files });
        res.json({ message: "Thêm thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE
exports.updateRoomType = async (req, res) => {
    try {
        const result = await roomTypeService.updateRoomType({
            id: req.params.id,
            body: req.body,
            files: req.files,
        });

        if (result.notFound) {
            return res.status(404).json({ message: "Không tìm thấy loại phòng" });
        }

        res.json({ message: "Cập nhật thành công" });

    } catch (err) {
        console.error("Lỗi Controller:", err);
        res.status(500).json({ message: "Lỗi Server: " + err.message });
    }
};

// DELETE
exports.deleteRoomType = async (req, res) => {
    try {
        await roomTypeService.deleteRoomType(req.params.id);
        res.json({ message: "Xóa thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};