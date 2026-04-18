const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

router.get("/available-rooms", bookingController.getAvailableRooms);
router.post("/", bookingController.createBooking);
router.get("/", bookingController.getBookings);
router.put("/:id/status", bookingController.updateBookingStatus);
router.delete("/:id", bookingController.deleteBooking);

module.exports = router;