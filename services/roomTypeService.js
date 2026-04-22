const cloudinary = require("../cloudinary");
const roomTypeRepository = require("../repositories/roomTypeRepository");

const getPublicId = (url) => {
  if (!url) return null;
  try {
    const parts = url.split("/");
    const folderIndex = parts.indexOf("room_types");
    if (folderIndex === -1) return null;

    const publicIdWithExtension = parts.slice(folderIndex).join("/");
    return publicIdWithExtension.split(".")[0];
  } catch (error) {
    console.error("Lỗi tách public_id:", error);
    return null;
  }
};

const mapImages = (row) => ({
  ...row,
  images: [row.image1, row.image2].filter(Boolean),
});

const getAllRoomTypes = async () => {
  return roomTypeRepository.getAllRoomTypes();
};

const searchRoomTypes = async (keyword) => {
  if (!keyword || !keyword.trim()) {
    return [];
  }

  const trimmed = keyword.trim();
  const num = Number(trimmed);
  const isNum = !isNaN(num) && trimmed !== "";
  let whereSql = "WHERE (rt.room_name LIKE ? OR rt.description LIKE ?)";
  const params = [`%${trimmed}%`, `%${trimmed}%`];

  if (isNum) {
    whereSql += " OR rt.max_guests >= ? OR rt.price_per_night <= ?";
    params.push(num, num);
  }

  const rows = await roomTypeRepository.searchRoomTypes({ whereSql, params });
  return rows.map(mapImages);
};

const getRoomTypeById = async (id) => {
  return roomTypeRepository.getRoomTypeById(id);
};

const createRoomType = async ({ body, files }) => {
  const { room_name, price_per_night, max_guests, description } = body;
  const image1 = files?.image1?.[0]?.path || null;
  const image2 = files?.image2?.[0]?.path || null;

  await roomTypeRepository.createRoomType({
    room_name,
    price_per_night,
    max_guests,
    description,
    image1,
    image2,
  });
};

const updateRoomType = async ({ id, body, files }) => {
  const { room_name, price_per_night, max_guests, description } = body;
  const oldImages = await roomTypeRepository.getRoomTypeImagesById(id);

  if (!oldImages) {
    return { notFound: true };
  }

  let image1 = oldImages.image1;
  let image2 = oldImages.image2;

  if (files?.image1) {
    if (image1) {
      const publicId = getPublicId(image1);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }
    image1 = files.image1[0].path;
  }

  if (files?.image2) {
    if (image2) {
      const publicId = getPublicId(image2);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }
    image2 = files.image2[0].path;
  }

  await roomTypeRepository.updateRoomType({
    id,
    room_name,
    price_per_night,
    max_guests,
    description,
    image1,
    image2,
  });

  return { notFound: false };
};

const deleteRoomType = async (id) => {
  await roomTypeRepository.deleteRoomType(id);
};

module.exports = {
  getAllRoomTypes,
  searchRoomTypes,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  deleteRoomType,
};
