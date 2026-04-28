import express from "express"
import { checkFriendShip } from "../middlewares/friendMiddle.js"
import { createConversation, getConversation, getMessages, markAsSeen } from "../controllers/conversationController.js"

const router = express.Router()

router.post("/",  checkFriendShip,createConversation)
router.get('/', getConversation)
router.get('/:conversationId/messages', getMessages)
router.patch("/:conversationId/seen",markAsSeen)


export default router