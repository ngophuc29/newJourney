import express from "express"
import { autme } from "../controllers/userController.js"

const router = express.Router()

router.get('/me',autme)

export default router