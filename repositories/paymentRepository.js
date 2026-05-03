const db = require("../db");

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

const getPaidAmountByBookingId = async (connection, id) => {
  const [[row]] = await connection.query(
    `SELECT COALESCE(SUM(amount), 0) AS paid_amount FROM payments WHERE booking_id = ?`,
    [id]
  );
  return Number(row?.paid_amount) || 0;
};

module.exports = {
  createPayment,
  getPaidAmountByBookingId,
};
