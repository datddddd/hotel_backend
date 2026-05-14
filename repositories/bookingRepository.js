const db = require("../db");

const hasBookingConflict = async (connection, { roomId, checkInDate, checkOutDate }) => {
  const [rows] = await connection.query(
    `
      SELECT id FROM bookings
      WHERE room_id = ?
      AND LOWER(status) IN ('booked', 'checked_in')
      AND (check_in_date < ? AND check_out_date > ?)
      `,
    [roomId, checkOutDate, checkInDate]
  );
  return rows.length > 0;
};

const createBooking = async (
  connection,
  { customerId, roomId, checkInDate, checkOutDate, totalPrice, status = "BOOKED" }
) => {
  const [result] = await connection.query(
    `
      INSERT INTO bookings
      (customer_id, room_id, check_in_date, check_out_date, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
    [customerId, roomId, checkInDate, checkOutDate, totalPrice, status]
  );
  return result.insertId;
};

const getBookings = async ({ whereSql, params, limit, offset }) => {
  const [rows] = await db.query(
    `
      SELECT
        b.*,
        c.full_name,
        r.room_number,
        rt.image1,
        COALESCE(SUM(p.amount), 0) AS paid_amount
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN room r ON b.room_id = r.id
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN payments p ON p.booking_id = b.id
      ${whereSql}
      GROUP BY b.id, c.full_name, r.room_number, rt.image1
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
      `,
    [...params, parseInt(limit, 10), parseInt(offset, 10)]
  );
  return rows;
};

const countBookings = async ({ whereSql, params }) => {
  const [[{ total }]] = await db.query(
    `
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN room r ON b.room_id = r.id
      ${whereSql}
      `,
    params
  );
  return total;
};

const updateBookingStatus = async ({ id, status }) => {
  await db.query(`UPDATE bookings SET status = ? WHERE id = ?`, [status, id]);
};

const getBookingTotalById = async (connection, id) => {
  const [[booking]] = await connection.query(
    `SELECT id, total_price FROM bookings WHERE id = ?`,
    [id]
  );
  return booking || null;
};

const getBookingDetailsForEmail = async (connection, id) => {
  const [[row]] = await connection.query(
    `
    SELECT 
      b.id as bookingId,
      b.check_in_date as checkInDate,
      b.check_out_date as checkOutDate,
      b.total_price as totalPrice,
      c.email,
      c.full_name as fullName
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    WHERE b.id = ?
    `,
    [id]
  );
  return row || null;
};

const deleteBooking = async (id) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `DELETE FROM payments WHERE booking_id = ?`,
      [id]
    );

    await connection.query(
      `DELETE FROM bookings WHERE id = ?`,
      [id]
    );

    await connection.commit();

  } catch (error) {

    await connection.rollback();
    throw error;

  } finally {

    connection.release();
  }
};

module.exports = {
  hasBookingConflict,
  createBooking,
  getBookings,
  countBookings,
  updateBookingStatus,
  getBookingTotalById,
  getBookingDetailsForEmail,
  deleteBooking,
};
