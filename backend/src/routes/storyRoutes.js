import express from "express";
import { createStory, getStories, viewStory } from "../controllers/storyController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/", upload.single("file"), createStory);
router.get("/", getStories);
router.patch("/:storyId/view", viewStory);

export default router;
