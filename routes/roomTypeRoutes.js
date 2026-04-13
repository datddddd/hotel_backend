const express = require('express');
const router = express.Router();
const roomTypeController = require('../controllers/roomTypeController');

router.get('/', roomTypeController.getAllRoomTypes);
router.get('/:id', roomTypeController.getRoomTypeById);
router.post('/', roomTypeController.createRoomType);
router.put('/:id', roomTypeController.updateRoomType);
router.delete('/:id', roomTypeController.deleteRoomType);

module.exports = router;