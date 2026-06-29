import express from "express"
import { authme, searchUserbyUsername, uploadAvatar, updateProfile, getUserById, blockUser, unblockUser, getBlockedUsers } from "../controllers/userController.js"
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router()

router.get('/me', authme)
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);
router.put("/profile", updateProfile);
router.get("/blocked", getBlockedUsers);
router.get("/:id", getUserById);
router.post("/block/:id", blockUser);
router.post("/unblock/:id", unblockUser);

export default router