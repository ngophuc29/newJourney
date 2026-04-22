import express from "express"
import { acceptFriend, declineFriend, getAllFriend, getAllFriendRequest, send } from "../controllers/friendController.js"

const router = express.Router()

router.post("/requests", send)
router.post('/requests/:requestId/accept', acceptFriend)
router.post('/requests/:requestId/decline', declineFriend)
router.get('/', getAllFriend)
router.get('/requests', getAllFriendRequest )




export default router