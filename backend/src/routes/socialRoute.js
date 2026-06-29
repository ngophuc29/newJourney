import express from "express";
import { toggleFollowUser, getFollowers, getFollowing, getSocialStats, getSuggestedUsers } from "../controllers/socialController.js";

const router = express.Router();

router.post("/follow/:targetUserId", toggleFollowUser);
router.get("/followers/:userId", getFollowers);
router.get("/following/:userId", getFollowing);
router.get("/stats/:username", getSocialStats);
router.get("/suggestions", getSuggestedUsers);

export default router;
