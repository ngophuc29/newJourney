import express from "express"
import { signIn, signUp, test } from "../controllers/authController.js"

const router = express.Router()
router.get("/test", test)
router.post("/signup",signUp)
router.post("/signin", signIn)
export default router