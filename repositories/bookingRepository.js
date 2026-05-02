const db = require("../db");

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

const findCustomerIdByUserId = async (connection, userId) => {
  const [rows] = await connection.query(
    "SELECT id FROM customers WHERE user_id = ?",
    [userId]
  );
  return rows[0]?.id || null;
};

const findCustomerIdByEmail = async (connection, email) => {
  const [rows] = await connection.query("SELECT id FROM customers WHERE email = ?", [email]);
  return rows[0]?.id || null;
};

const createCustomer = async (connection, payload) => {
  const { full_name, phone, email, id_card, user_id = null } = payload;
  const [result] = await connection.query(
    `INSERT INTO customers (full_name, phone, email, id_card, user_id)
     VALUES (?, ?, ?, ?, ?)`,
    [full_name, phone, email, id_card, user_id]
  );
  return result.insertId;
};

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

const createPayment = async (
  connection,
  { bookingId, amount, paymentMethod, status, useNow = true }
) => {
  const paidAtSql = useNow ? "NOW()" : "?";
  const params = useNow
    ? [bookingId, amount, paymentMethod, status]
    : [bookingId, amount, paymentMethod, status, new Date()];

  await connection.query(
    `
      INSERT INTO payments (booking_id, amount, payment_method, status, paid_at)
      VALUES (?, ?, ?, ?, ${paidAtSql})
      `,
    params
  );
};

const getBookings = async ({ whereSql, params, limit, offset }) => {
  const [rows] = await db.query(
    `
      SELECT
        b.*,
        c.full_name,
        r.room_number,
        COALESCE(SUM(p.amount), 0) AS paid_amount
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN room r ON b.room_id = r.id
      LEFT JOIN payments p ON p.booking_id = b.id
      ${whereSql}
      GROUP BY b.id, c.full_name, r.room_number
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

const updateRoomStatusByBookingId = async ({ bookingId, roomStatus }) => {
  await db.query(
    `UPDATE room SET status = ?
     WHERE id = (SELECT room_id FROM bookings WHERE id = ?)`,
    [roomStatus, bookingId]
  );
};

const getBookingTotalById = async (connection, id) => {
  const [[booking]] = await connection.query(
    `SELECT id, total_price FROM bookings WHERE id = ?`,
    [id]
  );
  return booking || null;
};

const getPaidAmountByBookingId = async (connection, id) => {
  const [[row]] = await connection.query(
    `SELECT COALESCE(SUM(amount), 0) AS paid_amount FROM payments WHERE booking_id = ?`,
    [id]
  );
  return Number(row?.paid_amount) || 0;
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

const getDashboardSummary = async () => {
  const [[bookingAgg]] = await db.query(
    `
      SELECT
        COUNT(*) AS total_bookings,
        COUNT(CASE WHEN status = 'BOOKED' THEN 1 END) AS booked_count,
        COUNT(CASE WHEN status = 'checked_in' THEN 1 END) AS checked_in_count,
        COUNT(CASE WHEN status = 'checked_out' THEN 1 END) AS checked_out_count,
        AVG(total_price) AS avg_booking_value
      FROM bookings
      `
  );

  const [[paymentAgg]] = await db.query(
    `
      SELECT
        COALESCE(SUM(b.total_price), 0) AS total_revenue,
        COALESCE(SUM(COALESCE(p.paid_amount, 0)), 0) AS collected_revenue,
        COALESCE(SUM(GREATEST(b.total_price - COALESCE(p.paid_amount, 0), 0)), 0) AS outstanding_revenue
      FROM bookings b
      LEFT JOIN (
        SELECT booking_id, SUM(amount) AS paid_amount
        FROM payments
        GROUP BY booking_id
      ) p ON p.booking_id = b.id
      WHERE LOWER(b.status) != 'cancelled'
      `
  );

  const [[roomAgg]] = await db.query(
    `
      SELECT
        COUNT(*) AS total_rooms,
        COUNT(CASE WHEN status = 'available' THEN 1 END) AS available_rooms,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) AS occupied_rooms
      FROM room
      `
  );

  return { bookingAgg, paymentAgg, roomAgg };
};

const getBookingTrend = async (days) => {
  const [trendRows] = await db.query(
    `
      SELECT
        DATE(b.created_at) AS date,
        COUNT(*) AS booking_count,
        COALESCE(SUM(b.total_price), 0) AS expected_revenue,
        COALESCE(SUM(COALESCE(p.paid_amount, 0)), 0) AS collected_revenue
      FROM bookings b
      LEFT JOIN (
        SELECT booking_id, SUM(amount) AS paid_amount
        FROM payments
        GROUP BY booking_id
      ) p ON p.booking_id = b.id
      WHERE b.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(b.created_at)
      ORDER BY DATE(b.created_at) ASC
      `,
    [days - 1]
  );
  return trendRows;
};

const getRecentBookings = async () => {
  const [rows] = await db.query(
    `
      SELECT
        b.id,
        c.full_name,
        r.room_number,
        b.status,
        b.total_price,
        b.created_at
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN room r ON b.room_id = r.id
      ORDER BY b.created_at DESC
      LIMIT 8
      `
  );
  return rows;
};

const deleteBooking = async (id) => {
  await db.query(`DELETE FROM bookings WHERE id = ?`, [id]);
};

module.exports = {
  getAvailableRooms,
  findCustomerIdByUserId,
  findCustomerIdByEmail,
  createCustomer,
  hasBookingConflict,
  createBooking,
  createPayment,
  getBookings,
  countBookings,
  updateBookingStatus,
  updateRoomStatusByBookingId,
  getBookingTotalById,
  getPaidAmountByBookingId,
  getBookingDetailsForEmail,
  getDashboardSummary,
  getBookingTrend,
  getRecentBookings,
  deleteBooking,
};
