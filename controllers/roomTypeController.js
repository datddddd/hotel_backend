const db = require('../db');
const upload = require("../middleware/upload");
const cloudinary = require("../cloudinary");

const getPublicId = (url) => {
    if (!url) return null;
    // URL thường có dạng: https://res.cloudinary.com/demo/image/upload/v12345/room_types/abcxyz.jpg
    // Chúng ta cần lấy phần: "room_types/abcxyz"
    try {
        const parts = url.split('/');
        const folderIndex = parts.indexOf('room_types'); // Tìm thư mục bạn đã đặt trong storage
        if (folderIndex === -1) return null;

        const publicIdWithExtension = parts.slice(folderIndex).join('/');
        return publicIdWithExtension.split('.')[0]; // Xóa đuôi .jpg, .png...
    } catch (error) {
        console.error("Lỗi tách public_id:", error);
        return null;
    }
};

// GET ALL
exports.getAllRoomTypes = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM room_types ORDER BY id DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// SEARCH — tìm kiếm tương đối bằng 1 từ khóa duy nhất
// Dùng image1/image2 ngay trên room_types, JOIN room để đếm phòng trống
exports.searchRoomTypes = async (req, res) => {
    try {
        const { keyword } = req.query;

        if (!keyword || !keyword.trim()) {
            return res.json([]);
        }

        const trimmed = keyword.trim();
        const num = Number(trimmed);
        const isNum = !isNaN(num) && trimmed !== "";

        // Tìm room_types khớp với keyword
        let whereSql = "WHERE (rt.room_name LIKE ? OR rt.description LIKE ?)";
        const params = [`%${trimmed}%`, `%${trimmed}%`];

        if (isNum) {
            whereSql += " OR rt.max_guests >= ? OR rt.price_per_night <= ?";
            params.push(num, num);
        }

        const sql = `
            SELECT 
                rt.id,
                rt.room_name,
                rt.price_per_night,
                rt.max_guests,
                rt.description,
                rt.image1,
                rt.image2,
                COUNT(DISTINCT CASE WHEN r.status = 'available' THEN r.id END) AS available_rooms
            FROM room_types rt
            LEFT JOIN room r ON r.room_type_id = rt.id
            ${whereSql}
            GROUP BY rt.id
            ORDER BY rt.id DESC
        `;

        const [rows] = await db.query(sql, params);

        // Chuyển image1/image2 thành mảng images để frontend dùng thống nhất
        const result = rows.map(row => ({
            ...row,
            images: [row.image1, row.image2].filter(Boolean),
        }));

        res.json(result);
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
        const { room_name, price_per_night, max_guests, description } = req.body;

        const image1 = req.files["image1"]?.[0]?.path || null;
        const image2 = req.files["image2"]?.[0]?.path || null;

        await db.query(
            `INSERT INTO room_types 
            (room_name, price_per_night, max_guests, description, image1, image2)
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
        const { room_name, price_per_night, max_guests, description } = req.body;

        // 1. Lấy dữ liệu cũ từ database
        const [old] = await db.query(
            "SELECT image1, image2 FROM room_types WHERE id=?",
            [req.params.id]
        );

        if (old.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy loại phòng" });
        }

        let image1 = old[0].image1;
        let image2 = old[0].image2;

        // 2. Xử lý ảnh 1: Nếu có file mới được upload
        if (req.files?.image1) {
            if (image1) {
                const publicId = getPublicId(image1);
                // CHỈ gọi destroy khi có publicId hợp lệ
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            }
            image1 = req.files.image1[0].path;
        }

        // 3. Xử lý ảnh 2: Nếu có file mới được upload
        if (req.files?.image2) {
            if (image2) {
                const publicId = getPublicId(image2);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            }
            image2 = req.files.image2[0].path;
        }

        // 4. Cập nhật Database
        await db.query(
            `UPDATE room_types 
             SET room_name=?, price_per_night=?, max_guests=?, description=?, image1=?, image2=? 
             WHERE id=?`,
            [room_name, price_per_night, max_guests, description, image1, image2, req.params.id]
        );

        res.json({ message: "Cập nhật thành công" });

    } catch (err) {
        console.error("Lỗi Controller:", err);
        res.status(500).json({ message: "Lỗi Server: " + err.message });
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