import Follow from "../models/Follow.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Notification from "../models/Notification.js";
import { io } from "../socket/index.js";

// Follow or Unfollow a user
export const toggleFollowUser = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const currentUserId = req.user._id;

        if (targetUserId.toString() === currentUserId.toString()) {
            return res.status(400).json({ message: "Bạn không thể theo dõi chính mình" });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        const existingFollow = await Follow.findOne({
            followerId: currentUserId,
            followingId: targetUserId
        });

        if (existingFollow) {
            // Unfollow
            await Follow.deleteOne({ _id: existingFollow._id });
            return res.status(200).json({ isFollowing: false, message: "Đã bỏ theo dõi" });
        } else {
            // Follow
            const newFollow = new Follow({
                followerId: currentUserId,
                followingId: targetUserId
            });
            await newFollow.save();

            // Create notification
            const newNotification = new Notification({
                userId: targetUserId,
                type: "follow",
                senderId: currentUserId,
                relatedId: currentUserId // Link back to the follower
            });
            await newNotification.save();

            // Real-time notify target user
            io.to(targetUserId.toString()).emit("new-notification", {
                notification: await newNotification.populate("senderId", "displayName avatarURL username")
            });

            return res.status(200).json({ isFollowing: true, message: "Đã theo dõi" });
        }
    } catch (error) {
        console.error("Error in toggleFollowUser:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi thực hiện theo dõi" });
    }
};

// Get followers of a user
export const getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const followers = await Follow.find({ followingId: userId })
            .populate("followerId", "displayName username avatarURL bio");
            
        return res.status(200).json(followers.map(f => f.followerId));
    } catch (error) {
        console.error("Error in getFollowers:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi lấy danh sách người theo dõi" });
    }
};

// Get list of users a user is following
export const getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const following = await Follow.find({ followerId: userId })
            .populate("followingId", "displayName username avatarURL bio");
            
        return res.status(200).json(following.map(f => f.followingId));
    } catch (error) {
        console.error("Error in getFollowing:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi lấy danh sách đang theo dõi" });
    }
};

// Get social stats for a user (posts, followers, following, isFollowing)
export const getSocialStats = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user._id;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        const [postCount, followersCount, followingCount, isFollowing] = await Promise.all([
            Post.countDocuments({ userId: user._id }),
            Follow.countDocuments({ followingId: user._id }),
            Follow.countDocuments({ followerId: user._id }),
            Follow.findOne({ followerId: currentUserId, followingId: user._id })
        ]);

        return res.status(200).json({
            user: {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatarURL: user.avatarURL,
                coverPhotoURL: user.coverPhotoURL,
                bio: user.bio
            },
            stats: {
                posts: postCount,
                followers: followersCount,
                following: followingCount
            },
            isFollowing: !!isFollowing
        });
    } catch (error) {
        console.error("Error in getSocialStats:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi lấy thông số cá nhân" });
    }
};

// Get suggested users to follow (excluding self and already followed users)
export const getSuggestedUsers = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        // Find users already followed
        const followedRelations = await Follow.find({ followerId: currentUserId });
        const followedIds = followedRelations.map(rel => rel.followingId);

        // Find users that are not followed and not self
        const suggestions = await User.find({
            _id: { $nin: [...followedIds, currentUserId] }
        })
        .limit(5)
        .select("displayName username avatarURL bio");

        return res.status(200).json(suggestions);
    } catch (error) {
        console.error("Error in getSuggestedUsers:", error);
        return res.status(500).json({ message: "Lỗi máy chủ khi gợi ý người dùng" });
    }
};
