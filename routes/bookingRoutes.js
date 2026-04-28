const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const verifyToken = require("../middleware/auth");

router.get("/available-rooms", bookingController.getAvailableRooms);
router.get("/dashboard/report", bookingController.getDashboardReport);
router.get("/my-bookings", verifyToken, bookingController.getMyBookings);
router.post("/", verifyToken, bookingController.createBooking);
router.get("/", bookingController.getBookings);
router.put("/:id/status", bookingController.updateBookingStatus);
router.post("/:id/pay-full", bookingController.payFullRemaining);
router.delete("/:id", bookingController.deleteBooking);

module.exports = router;