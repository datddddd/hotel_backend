const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const verifyToken = require("../middleware/auth");

router.get("/available-rooms", bookingController.getAvailableRooms);
router.get("/dashboard/report", verifyToken, bookingController.getDashboardReport);
router.get("/my-bookings", verifyToken, bookingController.getMyBookings);
router.post("/", verifyToken, bookingController.createBooking);
router.get("/", verifyToken, bookingController.getBookings);
router.put("/:id/status", verifyToken, bookingController.updateBookingStatus);
router.post("/:id/pay-full", verifyToken, bookingController.payFullRemaining);
router.delete("/:id", verifyToken, bookingController.deleteBooking);

module.exports = router;