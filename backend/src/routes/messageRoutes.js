import express from "express"
import { revokeMessage, sendDirectMessage, sendGroupMessage, toggleMessageReaction } from "../controllers/messageController.js"
import { checkFriendShip, checkGroupMemberShip } from "../middlewares/friendMiddle.js"
import { upload } from "../middlewares/uploadMiddleware.js"

const router = express.Router()

router.post("/direct", upload.single("file"), checkFriendShip,sendDirectMessage)
router.post("/group", upload.single("file"), checkGroupMemberShip, sendGroupMessage)
router.patch("/:messageId/reactions", toggleMessageReaction)
router.patch("/:messageId/revoke", revokeMessage)
export default router

