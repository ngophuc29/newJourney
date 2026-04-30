import express from "express"
import { sendFriendRequest,deniedFriend,getAllFriend,getFriendRequest,acceptFriend} from "../controllers/friendController.js"
import { searchUserbyUsername } from "../controllers/userController.js"
const router = express.Router()

router.post("/requests", sendFriendRequest)
router.post("/requests/:requestId/accept", acceptFriend)
router.post("/requests/:requestId/decline", deniedFriend)
router.get("/friends", getAllFriend)
router.get("/requests", getFriendRequest)
router.get('/search', searchUserbyUsername)

export default router
// 1:02:07