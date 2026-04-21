import express from "express"
import { sendFriendRequest,deniedFriend,getAllFriend,getFriendRequest,acceptFriend} from "../controllers/friendController.js"
const router = express.Router()

router.post("/requests", sendFriendRequest)
router.post("/requests/:requestId/accept", acceptFriend)
router.post("/requests/:requestId/decline", deniedFriend)
router.get("/", getAllFriend)
router.get("/requests", getFriendRequest)

export default router
