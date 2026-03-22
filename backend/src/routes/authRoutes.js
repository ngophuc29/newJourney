import express from "express"
import { signIn, signOut, signUp, test } from "../controllers/authController.js"

const router = express.Router()
router.get("/test", test)
router.post("/signup",signUp)
router.post("/signin", signIn)
router.post("/signout",signOut)
export default router