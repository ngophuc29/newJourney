import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Follow from "../models/Follow.js";
import User from "../models/User.js";
import Friend from "../models/Friend.js";
import Notification from "../models/Notification.js";
import { uploadMediaFromBuffer } from "../middlewares/uploadMiddleware.js";
import { io } from "../socket/index.js";

// Helper to upload multiple files to Cloudinary
const uploadPostMedia = async (files) => {
    if (!files || !Array.isArray(files) || files.length === 0) return [];
    
    const uploadPromises = files.map(async (file) => {
        const isVideo = file.mimetype.startsWith("video/");
        const mediaType = isVideo ? "video" : "image";
        
        const originalName = file.originalname || "file";
        const parts = originalName.split(".");
        const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";
        const nameWithoutExt = parts.join(".").replace(/[^a-zA-Z0-9-_]/g, "_");
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const publicId = ext ? `posts/${nameWithoutExt}_${uniqueId}` : `posts/${nameWithoutExt}_${uniqueId}`;
        
        const result = await uploadMediaFromBuffer(file.buffer, {
            folder: "phuc_chat/posts",
            resource_type: isVideo ? "video" : "image",
            public_id: publicId
        });
        
        return {
            url: result.secure_url,
            type: mediaType,
            publicId: result.public_id
        };
    });
    
    return Promise.all(uploadPromises);
};

// Create a new post
export const createPost = async (req, res) => {
    try {
        const { content, privacy } = req.body;
        const userId = req.user._id;
        
        let media = [];
        if (req.files && req.files.length > 0) {
            media = await uploadPostMedia(req.files);
        }
        
        if (!content && media.length === 0) {
            return res.status(400).json({ message: "Bài viết phải có nội dung hoặc hình ảnh/video" });
        }
        
        let mentions = [];
        if (req.body.mentions) {
            try {
                mentions = JSON.parse(req.body.mentions);
            } catch (e) {
                mentions = Array.isArray(req.body.mentions) ? req.body.mentions : [req.body.mentions];
            }
        }
        
        const newPost = new Post({
            userId,
            content,
            media,
            privacy: privacy || "public",
            mentions
        });
        
        await newPost.save();
        
        // Gửi thông báo đến những người được tag/mention
        if (mentions && mentions.length > 0) {
            const notifyPromises = mentions.map(async (mentionedUserId) => {
                if (mentionedUserId.toString() === userId.toString()) return;
                
                const newNotification = new Notification({
                    userId: mentionedUserId,
                    type: "post_mention",
                    senderId: userId,
                    relatedId: newPost._id
                });
                await newNotification.save();
                
                // Real-time notify via Socket.io
                io.to(mentionedUserId.toString()).emit("new-notification", {
                    notification: await newNotification.populate("senderId", "displayName avatarURL username")
                });
            });
            await Promise.all(notifyPromises);
        }
        
        const populatedPost = await Post.findById(newPost._id)
            .populate("userId", "displayName username avatarURL")
            .populate("mentions", "displayName username avatarURL");
            
        return res.status(201).json(populatedPost);
    } catch (error) {
        console.error("Error in createPost:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi tạo bài viết" });
    }
};

// Get News Feed (posts from followed users + own posts + fallback public posts)
export const getFeed = async (req, res) => {
    try {
        const userId = req.user._id;
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        
        // Find users that the current user follows
        const followedRelations = await Follow.find({ followerId: userId });
        const followedIds = followedRelations.map(rel => rel.followingId);
        
        // Include self
        const authorIds = [...followedIds, userId];
        
        // Get posts
        let posts = await Post.find({
            $or: [
                { userId: { $in: authorIds } },
                { privacy: "public" } // fallback to keep feed active
            ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "displayName username avatarURL")
        .populate("mentions", "displayName username avatarURL");
        
        const total = await Post.countDocuments({
            $or: [
                { userId: { $in: authorIds } },
                { privacy: "public" }
            ]
        });
        
        return res.status(200).json({
            posts,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + posts.length < total
        });
    } catch (error) {
        console.error("Error in getFeed:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi lấy bảng tin" });
    }
};

// Get Explore Feed (public posts with high engagement or recent)
export const getExplorePosts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 12;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        
        const posts = await Post.find({ privacy: "public" })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("userId", "displayName username avatarURL")
            .populate("mentions", "displayName username avatarURL");
            
        const total = await Post.countDocuments({ privacy: "public" });
        
        return res.status(200).json({
            posts,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + posts.length < total
        });
    } catch (error) {
        console.error("Error in getExplorePosts:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi lấy trang khám phá" });
    }
};

// Get User Profile Posts
export const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user._id;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
        
        // Determine privacy filter
        let privacyFilter = ["public"];
        if (user._id.toString() === currentUserId.toString()) {
            privacyFilter = ["public", "friends", "private"];
        } else {
            // Check if they are friends
            let userA = currentUserId.toString();
            let userB = user._id.toString();
            if (userA > userB) {
                [userA, userB] = [userB, userA];
            }
            const isFriend = await Friend.findOne({ userA, userB });
            if (isFriend) {
                privacyFilter = ["public", "friends"];
            }
        }
        
        const posts = await Post.find({
            userId: user._id,
            privacy: { $in: privacyFilter }
        })
        .sort({ createdAt: -1 })
        .populate("userId", "displayName username avatarURL")
        .populate("mentions", "displayName username avatarURL");
        
        return res.status(200).json(posts);
    } catch (error) {
        console.error("Error in getUserPosts:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi lấy bài đăng của người dùng" });
    }
};

// Like/Unlike/React to a post
export const toggleLikePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { type = "like" } = req.body;
        const userId = req.user._id;

        // validate type
        const validTypes = ["like", "love", "haha", "wow", "sad", "angry"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: "Loại cảm xúc không hợp lệ" });
        }
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Không tìm thấy bài viết" });
        }

        if (!post.reactions) {
            post.reactions = [];
        }
        
        const existingReactionIndex = post.reactions.findIndex(
            r => r.userId.toString() === userId.toString()
        );
        
        let removed = false;
        let reactionChanged = false;
        
        if (existingReactionIndex !== -1) {
            const currentReactionType = post.reactions[existingReactionIndex].type;
            if (currentReactionType === type) {
                // If clicking the same reaction, remove it (unlike)
                post.reactions.splice(existingReactionIndex, 1);
                post.likes = post.likes.filter(id => id.toString() !== userId.toString());
                removed = true;
            } else {
                // If clicking a different reaction, update it
                post.reactions[existingReactionIndex].type = type;
                reactionChanged = true;
            }
        } else {
            // Add new reaction
            post.reactions.push({ userId, type });
            if (!post.likes.includes(userId)) {
                post.likes.push(userId);
            }
        }
        
        // Create notification (if liking/reacting to someone else's post and it's a new reaction)
        if (!removed && !reactionChanged && post.userId.toString() !== userId.toString()) {
            const newNotification = new Notification({
                userId: post.userId,
                type: "post_like",
                senderId: userId,
                relatedId: post._id
            });
            await newNotification.save();
            
            // Real-time notify via Socket.io
            io.to(post.userId.toString()).emit("new-notification", {
                notification: await newNotification.populate("senderId", "displayName avatarURL")
            });
        }
        
        await post.save();
        
        return res.status(200).json({
            likes: post.likes,
            likesCount: post.likes.length,
            reactions: post.reactions,
            isLiked: !removed
        });
    } catch (error) {
        console.error("Error in toggleLikePost:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi cập nhật cảm xúc bài viết" });
    }
};

// Add Comment
export const addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, parentId } = req.body;
        const userId = req.user._id;
        
        if (!content || content.trim() === "") {
            return res.status(400).json({ message: "Bình luận không được để trống" });
        }
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Không tìm thấy bài viết" });
        }
        
        let mentions = [];
        if (req.body.mentions) {
            try {
                mentions = JSON.parse(req.body.mentions);
            } catch (e) {
                mentions = Array.isArray(req.body.mentions) ? req.body.mentions : [req.body.mentions];
            }
        }

        const comment = new Comment({
            postId,
            userId,
            parentId: parentId || null,
            content: content.trim(),
            mentions
        });
        
        await comment.save();
        
        // Update post comment count
        post.commentsCount += 1;
        await post.save();
        
        // Gửi thông báo đến những người được tag/mention trong bình luận
        if (mentions && mentions.length > 0) {
            const notifyPromises = mentions.map(async (mentionedUserId) => {
                if (mentionedUserId.toString() === userId.toString()) return;
                
                const newNotification = new Notification({
                    userId: mentionedUserId,
                    type: "comment_mention",
                    senderId: userId,
                    relatedId: postId
                });
                await newNotification.save();
                
                // Real-time notify via Socket.io
                io.to(mentionedUserId.toString()).emit("new-notification", {
                    notification: await newNotification.populate("senderId", "displayName avatarURL username")
                });
            });
            await Promise.all(notifyPromises);
        }

        const populatedComment = await Comment.findById(comment._id)
            .populate("userId", "displayName username avatarURL")
            .populate("mentions", "displayName username avatarURL");
            
        // Create notification for post owner (if commenting on someone else's post)
        if (post.userId.toString() !== userId.toString()) {
            const newNotification = new Notification({
                userId: post.userId,
                type: "post_comment",
                senderId: userId,
                relatedId: post._id
            });
            await newNotification.save();
            
            io.to(post.userId.toString()).emit("new-notification", {
                notification: await newNotification.populate("senderId", "displayName avatarURL")
            });
        }
        
        return res.status(201).json(populatedComment);
    } catch (error) {
        console.error("Error in addComment:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi bình luận" });
    }
};

// Get Post Comments
export const getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        
        // Find top-level comments first
        const comments = await Comment.find({ postId, parentId: null })
            .sort({ createdAt: 1 })
            .populate("userId", "displayName username avatarURL")
            .populate("mentions", "displayName username avatarURL");
            
        // Find replies for each comment
        const commentIds = comments.map(c => c._id);
        const replies = await Comment.find({ parentId: { $in: commentIds } })
            .sort({ createdAt: 1 })
            .populate("userId", "displayName username avatarURL")
            .populate("mentions", "displayName username avatarURL");
            
        // Map replies to their parent comments
        const commentsWithReplies = comments.map(comment => {
            const commentReplies = replies.filter(r => r.parentId.toString() === comment._id.toString());
            return {
                ...comment.toObject(),
                replies: commentReplies
            };
        });
        
        return res.status(200).json(commentsWithReplies);
    } catch (error) {
        console.error("Error in getPostComments:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi lấy bình luận" });
    }
};

// Delete Post
export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Không tìm thấy bài viết" });
        }
        
        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền xóa bài viết này" });
        }
        
        // Delete all comments of this post
        await Comment.deleteMany({ postId });
        
        // Delete the post
        await Post.findByIdAndDelete(postId);
        
        return res.status(200).json({ message: "Đã xóa bài viết thành công" });
    } catch (error) {
        console.error("Error in deletePost:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi xóa bài viết" });
    }
};

// Get single post by ID
export const getPostById = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId)
            .populate("userId", "displayName username avatarURL")
            .populate("mentions", "displayName username avatarURL");
            
        if (!post) {
            return res.status(404).json({ message: "Không tìm thấy bài viết" });
        }
        
        return res.status(200).json(post);
    } catch (error) {
        console.error("Error in getPostById:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi lấy chi tiết bài viết" });
    }
};

// Get Post Reactions list populated with user details
export const getPostReactions = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId)
            .populate("reactions.userId", "displayName username avatarURL");
        if (!post) {
            return res.status(404).json({ message: "Không tìm thấy bài viết" });
        }
        return res.status(200).json(post.reactions || []);
    } catch (error) {
        console.error("Error in getPostReactions:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi lấy danh sách cảm xúc" });
    }
};
