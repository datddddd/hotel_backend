const db = require("../db");


// ================= GET AVAILABLE ROOMS =================
exports.getAvailableRooms = async (req, res) => {
  const { check_in, check_out, room_type_id } = req.query;

  if (!check_in || !check_out) {
    return res.status(400).json({ message: "Thiếu ngày" });
  }

  try {
    let query = `
      SELECT * FROM room r
      WHERE r.id NOT IN (
        SELECT room_id FROM bookings
        WHERE status IN ('BOOKED', 'checked_in') 
        AND (
          check_in_date < ? AND check_out_date > ?
        )
      )
    `;

    const params = [check_out, check_in];

    if (room_type_id) {
      query += ` AND r.room_type_id = ? `;
      params.push(room_type_id);
    }

    const [rooms] = await db.query(query, params);
    res.json(rooms);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ================= CREATE BOOKING =================
exports.createBooking = async (req, res) => {
  const {
    full_name,
    phone,
    email,
    id_card,
    room_id,
    check_in_date,
    check_out_date,
    total_price,
    payment_amount,
    payment_method
  } = req.body;

  const connection = await db.getConnection();

  try {
    const totalPriceNum = Number(total_price) || 0;
    const paymentAmountNum = Number(payment_amount) || 0;
    const paidAmount = Math.max(0, Math.min(paymentAmountNum, totalPriceNum));
    const remainingAmount = Math.max(0, totalPriceNum - paidAmount);
    const paymentStatus = remainingAmount > 0 ? "PARTIAL_PAID" : "PAID";

    await connection.beginTransaction();

    let customerId;

    // ================= CUSTOMER LOGIC =================
    if (req.user) {
      // user đã login
      const [exist] = await connection.query(
        "SELECT id FROM customers WHERE user_id = ?",
        [req.user.id]
      );

      if (exist.length > 0) {
        customerId = exist[0].id;
      } else {
        const [cust] = await connection.query(
          `INSERT INTO customers (full_name, phone, email, id_card, user_id)
           VALUES (?, ?, ?, ?, ?)`,
          [full_name, phone, email, id_card, req.user.id]
        );
        customerId = cust.insertId;
      }
    } else {
      // guest → tránh trùng email
      const [exist] = await connection.query(
        "SELECT id FROM customers WHERE email = ?",
        [email]
      );

      if (exist.length > 0) {
        customerId = exist[0].id;
      } else {
        const [cust] = await connection.query(
          `INSERT INTO customers (full_name, phone, email, id_card)
           VALUES (?, ?, ?, ?)`,
          [full_name, phone, email, id_card]
        );
        customerId = cust.insertId;
      }
    }

    // ================= CHECK ROOM AVAILABLE =================
    const [checkRoom] = await connection.query(
      `
      SELECT id FROM bookings
      WHERE room_id = ?
      AND status IN ('BOOKED', 'checked_in')
      AND (check_in_date < ? AND check_out_date > ?)
      `,
      [room_id, check_out_date, check_in_date]
    );

    if (checkRoom.length > 0) {
      throw new Error("Phòng đã được đặt trong khoảng thời gian này");
    }

    // ================= CREATE BOOKING =================
    const [booking] = await connection.query(
      `
      INSERT INTO bookings 
      (customer_id, room_id, check_in_date, check_out_date, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [customerId, room_id, check_in_date, check_out_date, totalPriceNum, "BOOKED"]
    );

    const bookingId = booking.insertId;

    // ================= CREATE PAYMENT =================
    await connection.query(
      `
      INSERT INTO payments (booking_id, amount, payment_method, status, paid_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [bookingId, paidAmount, payment_method, paymentStatus]
    );

    await connection.commit();

    res.json({
      message: "Đặt phòng thành công",
      bookingId,
      payment_status: paymentStatus,
      remaining_amount: remainingAmount
    });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
};



// ================= GET BOOKINGS =================
exports.getBookings = async (req, res) => {
  const {
    page = 1,
    limit = 6,
    status,
    search,
    check_in,
    check_out
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let where = [];
    let params = [];

    if (status) {
      where.push("b.status = ?");
      params.push(status);
    }

    if (search) {
      where.push(`(
        c.full_name LIKE ? OR 
        r.room_number LIKE ?
      )`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (check_in && check_out) {
      where.push(`
        b.check_in_date < ? AND b.check_out_date > ?
      `);
      params.push(check_out, check_in);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `
      SELECT 
        b.*,
        c.full_name,
        r.room_number,
        COALESCE(SUM(p.amount), 0) AS paid_amount,
        MAX(p.status) AS payment_status
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN room r ON b.room_id = r.id
      LEFT JOIN payments p ON p.booking_id = b.id
      ${whereSQL}
      GROUP BY b.id, c.full_name, r.room_number
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const normalizedRows = rows.map((row) => {
      const totalPrice = Number(row.total_price) || 0;
      const paidAmount = Number(row.paid_amount) || 0;
      const remainingAmount = Math.max(0, totalPrice - paidAmount);
      return {
        ...row,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        payment_status: row.payment_status || (remainingAmount > 0 ? "PARTIAL_PAID" : "PAID"),
      };
    });

    const [[{ total }]] = await db.query(
      `
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN room r ON b.room_id = r.id
      ${whereSQL}
      `,
      params
    );

    res.json({
      data: normalizedRows,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ================= UPDATE STATUS =================
exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.query(
      `UPDATE bookings SET status = ? WHERE id = ?`,
      [status, id]
    );

    if (status === "checked_in") {
      await db.query(
        `UPDATE room SET status = 'occupied' 
         WHERE id = (SELECT room_id FROM bookings WHERE id = ?)`,
        [id]
      );
    }

    if (status === "checked_out") {
      await db.query(
        `UPDATE rooms SET status = 'available' 
         WHERE id = (SELECT room_id FROM bookings WHERE id = ?)`,
        [id]
      );
    }

    res.json({ message: "Cập nhật thành công" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ================= DELETE =================
exports.deleteBooking = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(`DELETE FROM bookings WHERE id = ?`, [id]);
    res.json({ message: "Xóa thành công" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};