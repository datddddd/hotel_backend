const db = require("../db");

// 🔍 CHECK PHÒNG TRỐNG
// 🔍 CHECK PHÒNG TRỐNG (Cập nhật trong bookingController.js)
exports.getAvailableRooms = async (req, res) => {
  const { check_in, check_out, room_type_id } = req.query; // Thêm room_type_id

  if (!check_in || !check_out) {
    return res.status(400).json({ message: "Thiếu ngày" });
  }

  try {
    let query = `
      SELECT * FROM room r
      WHERE r.id NOT IN (
        SELECT room_id FROM bookings
        WHERE NOT (
          check_out_date <= ? OR check_in_date >= ?
        )
      )
    `;
    const params = [check_in, check_out];

    // Nếu người dùng chọn loại phòng, thêm điều kiện lọc
    if (room_type_id) {
      query += ` AND r.room_type_id = ?`;
      params.push(room_type_id);
    }

    const [rooms] = await db.query(query, params);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➕ TẠO BOOKING
exports.createBooking = async (req, res) => {
  const {
    full_name,
    phone,
    email,
    room_id,
    check_in_date,
    check_out_date,
    total_price
  } = req.body;
  console.log("BODY:", req.body);
  try {
    // 1. Tạo customer
    const [customerResult] = await db.query(
      `INSERT INTO customers (full_name, phone, email)
       VALUES (?, ?, ?)`,
      [full_name, phone, email]
    );

    const customerId = customerResult.insertId;

    // 2. Tạo booking
    const [bookingResult] = await db.query(
      `INSERT INTO bookings
      (customer_id, room_id, check_in_date, check_out_date, total_price)
      VALUES (?, ?, ?, ?, ?)`,
      [customerId, room_id, check_in_date, check_out_date, total_price]
    );

    res.json({
      message: "Đặt phòng thành công",
      booking_id: bookingResult.insertId
    });

  } catch (err) {
  console.error("🔥 ERROR:", err);
  res.status(500).json({ message: err.message });
}
};

// 📋 LẤY DANH SÁCH BOOKING
exports.getBookings = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*, c.full_name, r.room_number
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN room r ON b.room_id = r.id
      ORDER BY b.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔄 UPDATE STATUS
exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.query(
      `UPDATE bookings SET status = ? WHERE id = ?`,
      [status, id]
    );

    // 👉 Update room theo status
    if (status === "checked_in") {
      await db.query(`UPDATE room SET status='occupied' WHERE id = (SELECT room_id FROM bookings WHERE id = ?)`, [id]);
    }

    if (status === "checked_out") {
      await db.query(`UPDATE room SET status='available' WHERE id = (SELECT room_id FROM bookings WHERE id = ?)`, [id]);
    }

    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};