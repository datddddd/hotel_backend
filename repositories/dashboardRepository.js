const db = require("../db");

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

module.exports = {
  getDashboardSummary,
  getBookingTrend,
  getRecentBookings,
};
