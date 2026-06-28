import express from "express";
import { getNotifications, markAsRead, deleteNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", getNotifications);
router.patch("/:notificationId/read", markAsRead);
router.delete("/:notificationId", deleteNotification);

export default router;
