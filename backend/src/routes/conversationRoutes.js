import express from "express"
import { checkFriendShip } from "../middlewares/friendMiddle.js"
import { createConversation, getConversation, getMessages } from "../controllers/conversationController.js"

const router = express.Router()

router.post("/",  checkFriendShip,createConversation)
router.get('/', getConversation)
router.get('/:conversationId/messages', getMessages)


export default router