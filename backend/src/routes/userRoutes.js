import express from "express"
import { authme, searchUserbyUsername } from "../controllers/userController.js"

const router = express.Router()

router.get('/me', authme)


export default router