const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const verifyToken = require('../middleware/auth');

router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);
router.post('/', verifyToken, roomController.createRoom);
router.put('/:id', verifyToken, roomController.updateRoom);
router.delete('/:id', verifyToken, roomController.deleteRoom);

module.exports = router;