import express from "express"
import { acceptFriend, declineFriend, send } from "../controllers/friendController.js"

const router = express.Router()

router.post("/requests", send)
router.post('/requests/:requestId/accept', acceptFriend)
router.post('/requests/:requestId/decline', declineFriend)


export default router