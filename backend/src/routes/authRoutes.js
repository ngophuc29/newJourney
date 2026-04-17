import express from "express"
import { refreshToken, signIn, signOut, signUp, test } from "../controllers/authController.js"

const router = express.Router()
router.get("/test", test)
router.post("/signup",signUp)
router.post("/signin", signIn)
router.post("/signout", signOut)
router.post("/refresh", refreshToken)

export default router

// 1:58:02