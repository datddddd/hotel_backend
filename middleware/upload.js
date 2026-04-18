const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary");

if (!cloudinary || !cloudinary.uploader) {
    console.error("Cloudinary chưa được cấu hình đúng! Kiểm tra file ../cloudinary");
}
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "room_types",
        allowed_formats: ["jpg", "png", "jpeg"],
    },
});

const upload = multer({ storage });

module.exports = upload;