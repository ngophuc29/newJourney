import express from "express"
import { checkFriendShip } from "../middlewares/friendMiddle.js"
import { addGroupMembers, createConversation, getConversation, getMessages, leaveGroup, markAsSeen, removeGroupMember, renameGroup, transferGroupOwner } from "../controllers/conversationController.js"

const router = express.Router()

router.post("/",  checkFriendShip,createConversation)
router.get('/', getConversation)
router.patch('/:conversationId/group/name', renameGroup)
router.post('/:conversationId/group/members', addGroupMembers)
router.delete('/:conversationId/group/members/:memberId', removeGroupMember)
router.patch('/:conversationId/group/owner', transferGroupOwner)
router.post('/:conversationId/group/leave', leaveGroup)
router.get('/:conversationId/messages', getMessages)
router.patch("/:conversationId/seen",markAsSeen)


export default router
