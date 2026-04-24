import express from "express"
import { createConversation, getConversation } from "../controllers/conservationController.js"
import { checkFriendShip } from "../middlewares/friendMiddleware.js"

const router = express.Router()

router.post("/", checkFriendShip,createConversation)
router.get("/", getConversation)
router.get("/:conversationId/messages", getConversation)



export default router