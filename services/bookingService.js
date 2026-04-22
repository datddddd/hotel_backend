const db = require("../db");
const bookingRepository = require("../repositories/bookingRepository");

const normalizePayment = ({ totalPrice, paymentAmount }) => {
  const totalPriceNum = Number(totalPrice) || 0;
  const paymentAmountNum = Number(paymentAmount) || 0;
  const paidAmount = Math.max(0, Math.min(paymentAmountNum, totalPriceNum));
  const remainingAmount = Math.max(0, totalPriceNum - paidAmount);
  const paymentStatus = remainingAmount > 0 ? "PARTIAL_PAID" : "PAID";

  return { totalPriceNum, paidAmount, remainingAmount, paymentStatus };
};

const ensureCustomer = async (connection, bookingPayload, user) => {
  if (user) {
    const byUserId = await bookingRepository.findCustomerIdByUserId(connection, user.id);
    if (byUserId) return byUserId;
    return bookingRepository.createCustomer(connection, {
      full_name: bookingPayload.full_name,
      phone: bookingPayload.phone,
      email: bookingPayload.email,
      id_card: bookingPayload.id_card,
      user_id: user.id,
    });
  }

  const byEmail = await bookingRepository.findCustomerIdByEmail(connection, bookingPayload.email);
  if (byEmail) return byEmail;
  return bookingRepository.createCustomer(connection, {
    full_name: bookingPayload.full_name,
    phone: bookingPayload.phone,
    email: bookingPayload.email,
    id_card: bookingPayload.id_card,
  });
};

const getAvailableRooms = async ({ check_in, check_out, room_type_id }) => {
  return bookingRepository.getAvailableRooms({
    checkIn: check_in,
    checkOut: check_out,
    roomTypeId: room_type_id,
  });
};

const createBooking = async ({ payload, user }) => {
  const connection = await db.getConnection();
  try {
    const payment = normalizePayment({
      totalPrice: payload.total_price,
      paymentAmount: payload.payment_amount,
    });

    await connection.beginTransaction();

    const customerId = await ensureCustomer(connection, payload, user);
    const hasConflict = await bookingRepository.hasBookingConflict(connection, {
      roomId: payload.room_id,
      checkInDate: payload.check_in_date,
      checkOutDate: payload.check_out_date,
    });

    if (hasConflict) {
      throw new Error("Phòng đã được đặt trong khoảng thời gian này");
    }

    const bookingId = await bookingRepository.createBooking(connection, {
      customerId,
      roomId: payload.room_id,
      checkInDate: payload.check_in_date,
      checkOutDate: payload.check_out_date,
      totalPrice: payment.totalPriceNum,
    });

    await bookingRepository.createPayment(connection, {
      bookingId,
      amount: payment.paidAmount,
      paymentMethod: payload.payment_method,
      status: payment.paymentStatus,
    });

    await connection.commit();
    return {
      bookingId,
      payment_status: payment.paymentStatus,
      remaining_amount: payment.remainingAmount,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getBookings = async ({ page = 1, limit = 6, status, search, check_in, check_out }) => {
  const offset = (page - 1) * limit;
  const where = [];
  const params = [];

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

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = await bookingRepository.getBookings({ whereSql, params, limit, offset });
  const total = await bookingRepository.countBookings({ whereSql, params });

  const normalizedRows = rows.map((row) => {
    const totalPrice = Number(row.total_price) || 0;
    const paidAmount = Number(row.paid_amount) || 0;
    const remainingAmount = Math.max(0, totalPrice - paidAmount);
    return {
      ...row,
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      payment_status: remainingAmount > 0 ? "PARTIAL_PAID" : "PAID",
    };
  });

  return {
    data: normalizedRows,
    pagination: {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page, 10),
    },
  };
};

const updateBookingStatus = async ({ id, status }) => {
  await bookingRepository.updateBookingStatus({ id, status });

  if (status === "checked_in") {
    await bookingRepository.updateRoomStatusByBookingId({
      bookingId: id,
      roomStatus: "occupied",
    });
  }

  if (status === "checked_out") {
    await bookingRepository.updateRoomStatusByBookingId({
      bookingId: id,
      roomStatus: "available",
    });
  }
};

const payFullRemaining = async ({ id, payment_method = "cash" }) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const booking = await bookingRepository.getBookingTotalById(connection, id);
    if (!booking) {
      await connection.rollback();
      return { notFound: true };
    }

    const paidAmount = await bookingRepository.getPaidAmountByBookingId(connection, id);
    const totalPrice = Number(booking.total_price) || 0;
    const remainingAmount = Math.max(0, totalPrice - paidAmount);

    if (remainingAmount <= 0) {
      await connection.rollback();
      return { alreadyPaid: true };
    }

    await bookingRepository.createPayment(connection, {
      bookingId: id,
      amount: remainingAmount,
      paymentMethod: payment_method,
      status: "PAID",
    });

    await connection.commit();
    return {
      paid_amount: paidAmount + remainingAmount,
      remaining_amount: 0,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getDashboardReport = async ({ days }) => {
  const normalizedDays = Math.min(Math.max(parseInt(days, 10) || 30, 7), 365);
  const { bookingAgg, paymentAgg, roomAgg } = await bookingRepository.getDashboardSummary();
  const trendRows = await bookingRepository.getBookingTrend(normalizedDays);
  const recentBookings = await bookingRepository.getRecentBookings();

  return {
    summary: {
      total_bookings: Number(bookingAgg.total_bookings) || 0,
      booked_count: Number(bookingAgg.booked_count) || 0,
      checked_in_count: Number(bookingAgg.checked_in_count) || 0,
      checked_out_count: Number(bookingAgg.checked_out_count) || 0,
      avg_booking_value: Number(bookingAgg.avg_booking_value) || 0,
      total_revenue: Number(paymentAgg.total_revenue) || 0,
      collected_revenue: Number(paymentAgg.collected_revenue) || 0,
      outstanding_revenue: Number(paymentAgg.outstanding_revenue) || 0,
      total_rooms: Number(roomAgg.total_rooms) || 0,
      available_rooms: Number(roomAgg.available_rooms) || 0,
      occupied_rooms: Number(roomAgg.occupied_rooms) || 0,
    },
    trend: trendRows.map((row) => ({
      date: row.date,
      booking_count: Number(row.booking_count) || 0,
      expected_revenue: Number(row.expected_revenue) || 0,
      collected_revenue: Number(row.collected_revenue) || 0,
    })),
    recent_bookings: recentBookings,
  };
};

const deleteBooking = async (id) => {
  await bookingRepository.deleteBooking(id);
};

module.exports = {
  getAvailableRooms,
  createBooking,
  getBookings,
  updateBookingStatus,
  payFullRemaining,
  getDashboardReport,
  deleteBooking,
};
