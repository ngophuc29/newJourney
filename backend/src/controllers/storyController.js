import Story from "../models/Story.js";
import Friend from "../models/Friend.js";
import { uploadMediaFromBuffer } from "../middlewares/uploadMiddleware.js";

const getMediaType = (mimetype = "") => {
    if (mimetype.startsWith("video/")) return "video";
    return "image";
};

export const createStory = async (req, res) => {
    try {
        const userId = req.user._id;
        if (!req.file) {
            return res.status(400).json({ message: "Vui lòng chọn ảnh hoặc video để đăng story" });
        }

        const mediaType = getMediaType(req.file.mimetype);
        const uploadResult = await uploadMediaFromBuffer(req.file.buffer, {
            resource_type: mediaType,
            folder: "phuc_chat/stories",
        });

        const story = await Story.create({
            userId,
            mediaUrl: uploadResult.secure_url,
            mediaType,
        });

        await story.populate("userId", "displayName avatarURL username");

        return res.status(201).json({ story });
    } catch (error) {
        console.error("Lỗi khi tạo story:", error);
        return res.status(500).json({ message: "Lỗi hệ thống khi đăng story" });
    }
};

export const getStories = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Tìm tất cả bạn bè
        const friendships = await Friend.find({
            $or: [{ userA: userId }, { userB: userId }]
        });
        const friendIds = friendships.map(f => 
            f.userA.toString() === userId.toString() ? f.userB : f.userA
        );

        // Bao gồm cả chính mình
        const allowedUserIds = [userId, ...friendIds];

        // 2. Tìm tất cả stories của bản thân và bạn bè trong vòng 24h
        const stories = await Story.find({
            userId: { $in: allowedUserIds }
        })
        .sort({ createdAt: -1 })
        .populate("userId", "displayName avatarURL username");

        // Nhóm stories theo userId để tiện hiển thị dạng vòng tròn ở frontend
        const groupedStories = {};
        stories.forEach((story) => {
            const uId = story.userId._id.toString();
            if (!groupedStories[uId]) {
                groupedStories[uId] = {
                    user: story.userId,
                    stories: [],
                };
            }
            groupedStories[uId].stories.push(story);
        });

        return res.status(200).json({ stories: Object.values(groupedStories) });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách story:", error);
        return res.status(500).json({ message: "Lỗi hệ thống khi lấy story" });
    }
};

export const viewStory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { storyId } = req.params;

        const story = await Story.findByIdAndUpdate(
            storyId,
            { $addToSet: { viewers: userId } },
            { new: true }
        );

        if (!story) {
            return res.status(404).json({ message: "Không tìm thấy story" });
        }

        return res.status(200).json({ message: "Đã xem story", storyId });
    } catch (error) {
        console.error("Lỗi khi xem story:", error);
        return res.status(500).json({ message: "Lỗi hệ thống khi xem story" });
    }
};
