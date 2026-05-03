const db = require("../db");

const countRooms = async (whereClause, whereParams) => {
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM room r ${whereClause}`,
    whereParams
  );
  return total;
};

const getRooms = async ({ whereClause, whereParams, limit, offset }) => {
  const [rows] = await db.query(
    `
      SELECT r.*, rt.room_name, rt.price_per_night
      FROM room r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      ${whereClause}
      ORDER BY r.id DESC
      LIMIT ? OFFSET ?
    `,
    [...whereParams, limit, offset]
  );
  return rows;
};

const getRoomById = async (id) => {
  const [rows] = await db.query("SELECT * FROM room WHERE id = ?", [id]);
  return rows[0] || null;
};

const createRoom = async ({ room_number, room_type_id, status }) => {
  await db.query(
    `INSERT INTO room (room_number, room_type_id, status)
     VALUES (?, ?, ?)`,
    [room_number, room_type_id, status]
  );
};

const updateRoom = async ({ id, room_number, room_type_id, status }) => {
  await db.query(
    `UPDATE room
     SET room_number=?, room_type_id=?, status=?
     WHERE id=?`,
    [room_number, room_type_id, status, id]
  );
};

const getAvailableRooms = async ({ checkIn, checkOut, roomTypeId }) => {
  let query = `
      SELECT r.* FROM room r
  WHERE NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.room_id = r.id
      AND LOWER(b.status) IN ('booked', 'checked_in')
      AND b.check_in_date < ?
      AND b.check_out_date > ?
  )
    `;

  const params = [checkOut, checkIn];

  if (roomTypeId) {
    query += ` AND r.room_type_id = ? `;
    params.push(roomTypeId);
  }

  const [rooms] = await db.query(query, params);
  return rooms;
};

const deleteRoom = async (id) => {
  await db.query("DELETE FROM room WHERE id=?", [id]);
};

const updateRoomStatusByBookingId = async ({ bookingId, roomStatus }) => {
  await db.query(
    `UPDATE room SET status = ?
     WHERE id = (SELECT room_id FROM bookings WHERE id = ?)`,
    [roomStatus, bookingId]
  );
};

module.exports = {
  countRooms,
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getAvailableRooms,
  updateRoomStatusByBookingId,
};
