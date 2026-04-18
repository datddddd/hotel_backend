const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.delete("/:id/force", userController.deleteUsertrue); // Route để xóa vĩnh viễn
router.put("/:id/reset-password", userController.resetPassword);

module.exports = router;