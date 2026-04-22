const roomRepository = require("../repositories/roomRepository");

const getAllRooms = async ({ page = 1, limit = 6, search = "" }) => {
  const currentPage = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 6;
  const trimmedSearch = (search || "").trim();
  const offset = (currentPage - 1) * pageSize;
  const whereClause = trimmedSearch ? "WHERE r.room_number LIKE ?" : "";
  const whereParams = trimmedSearch ? [`%${trimmedSearch}%`] : [];

  const total = await roomRepository.countRooms(whereClause, whereParams);
  const rows = await roomRepository.getRooms({
    whereClause,
    whereParams,
    limit: pageSize,
    offset,
  });

  return {
    data: rows,
    pagination: {
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
      currentPage,
      limit: pageSize,
    },
  };
};

const getRoomById = async (id) => {
  return roomRepository.getRoomById(id);
};

const createRoom = async ({ room_number, room_type_id, status }) => {
  await roomRepository.createRoom({
    room_number,
    room_type_id,
    status: status || "available",
  });
};

const updateRoom = async ({ id, room_number, room_type_id, status }) => {
  await roomRepository.updateRoom({ id, room_number, room_type_id, status });
};

const deleteRoom = async (id) => {
  await roomRepository.deleteRoom(id);
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};
