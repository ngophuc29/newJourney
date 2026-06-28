import express from "express"
import { revokeMessage, sendDirectMessage, sendGroupMessage, toggleMessageReaction, editMessage, forwardMessage } from "../controllers/messageController.js"
import { checkFriendShip, checkGroupMemberShip } from "../middlewares/friendMiddle.js"
import { upload } from "../middlewares/uploadMiddleware.js"

const router = express.Router()

router.post("/direct", upload.single("file"), checkFriendShip,sendDirectMessage)
router.post("/group", upload.single("file"), checkGroupMemberShip, sendGroupMessage)
router.post("/forward", forwardMessage)
router.patch("/:messageId/reactions", toggleMessageReaction)
router.patch("/:messageId/revoke", revokeMessage)
router.patch("/:messageId/edit", editMessage)
export default router

