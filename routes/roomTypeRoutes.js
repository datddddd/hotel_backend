const express = require('express');
const router = express.Router();
const roomTypeController = require('../controllers/roomTypeController');
const upload = require("../middleware/upload");

router.get('/', roomTypeController.getAllRoomTypes);
router.get('/search', roomTypeController.searchRoomTypes);
router.get('/:id', roomTypeController.getRoomTypeById);
router.post('/', upload.fields([
        { name: "image1", maxCount: 1 },
        { name: "image2", maxCount: 1 },
    ]), roomTypeController.createRoomType);
router.put('/:id', upload.fields([
        { name: "image1", maxCount: 1 },
        { name: "image2", maxCount: 1 },
    ]), roomTypeController.updateRoomType);
router.delete('/:id', roomTypeController.deleteRoomType);

module.exports = router;