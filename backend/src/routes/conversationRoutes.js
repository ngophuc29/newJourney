import express from "express"
import { checkFriendShip } from "../middlewares/friendMiddle.js"
import { addGroupMembers, createConversation, getConversation, getMessages, getPinnedMessages, leaveGroup, markAsSeen, pinMessage, removeGroupMember, renameGroup, searchMessages, transferGroupOwner, unpinMessage, getConversationMedia } from "../controllers/conversationController.js"

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

// Pin messages
router.post('/:conversationId/pin', pinMessage)
router.delete('/:conversationId/pin/:messageId', unpinMessage)
router.get('/:conversationId/pins', getPinnedMessages)

// Search messages
router.get('/:conversationId/search', searchMessages)

// Shared Media Gallery
router.get('/:conversationId/media', getConversationMedia)

export default router
