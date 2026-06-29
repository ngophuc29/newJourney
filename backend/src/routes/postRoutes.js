import express from "express";
import { createPost, getFeed, getExplorePosts, getUserPosts, toggleLikePost, addComment, getPostComments, deletePost, getPostById } from "../controllers/postController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/", upload.array("media", 10), createPost);
router.get("/feed", getFeed);
router.get("/explore", getExplorePosts);
router.get("/user/:username", getUserPosts);
router.post("/:postId/like", toggleLikePost);
router.post("/:postId/comments", addComment);
router.get("/:postId/comments", getPostComments);
router.delete("/:postId", deletePost);
router.get("/:postId", getPostById);

export default router;
