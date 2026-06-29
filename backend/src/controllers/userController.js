import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";
import { io } from "../socket/index.js";;

export const authme = async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json({
            user
        });
    } catch (error) {
        console.log("Lỗi khi gọi authMe", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const searchUserbyUsername = async (req, res) => {
    try {
        const { username } = req.query;
        
        if (!username || username.trim() === "") {
            return res.status(400).json({
                message: "Cần cung cấp username"
            });
        }

        const user = await User.findOne({ username }).select("_id username displayName avatarURL bio phone");
        
        return res.status(200).json({
            user
        });
    } catch (error) {
        console.log("Lỗi khi searchUserByUsername", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const result = await uploadImageFromBuffer(file.buffer);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                avatarURL: result.secure_url,
                avatarId: result.public_id,
            },
            {
                new: true,
            }
        ).select("avatarURL");

        if (!updatedUser.avatarURL) {
            return res.status(400).json({ message: "Avatar trả về null" });
        }

        return res.status(200).json({ avatarURL: updatedUser.avatarURL });
    } catch (error) {
        console.error("Lỗi xảy ra khi upload avatar", error);
        return res.status(500).json({ message: "Upload failed" });
    }
};

export const uploadCoverPhoto = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const result = await uploadImageFromBuffer(file.buffer, {
            folder: "phuc_chat/covers",
            transformation: [{ width: 1200, height: 400, crop: "fill" }]
        });

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                coverPhotoURL: result.secure_url,
                coverPhotoID: result.public_id,
            },
            {
                new: true,
            }
        ).select("coverPhotoURL");

        return res.status(200).json({ coverPhotoURL: updatedUser.coverPhotoURL });
    } catch (error) {
        console.error("Lỗi xảy ra khi upload cover photo", error);
        return res.status(500).json({ message: "Upload failed" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { displayName, bio, phone } = req.body;
        const userId = req.user._id;

        if (displayName && displayName.trim().length < 1) {
            return res.status(400).json({ message: "Tên hiển thị không được bỏ trống" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                displayName: displayName?.trim(),
                bio: bio?.trim(),
                phone: phone?.trim()
            },
            { new: true }
        ).select("-hashedPassword");

        return res.status(200).json({
            message: "Cập nhật hồ sơ thành công",
            user: updatedUser
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật profile:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("_id username displayName avatarURL bio phone");
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Lỗi khi getUserById:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (id === userId.toString()) {
            return res.status(400).json({ message: "Bạn không thể tự chặn chính mình" });
        }

        await User.findByIdAndUpdate(userId, {
            $addToSet: { blockedUsers: id }
        });

        // Phát sự kiện realtime cho người bị chặn
        io.to(id.toString()).emit("user-blocked", { blockerId: userId.toString() });

        return res.status(200).json({ message: "Đã chặn người dùng thành công" });
    } catch (error) {
        console.error("Lỗi khi blockUser:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        await User.findByIdAndUpdate(userId, {
            $pull: { blockedUsers: id }
        });

        // Phát sự kiện realtime cho người được bỏ chặn
        io.to(id.toString()).emit("user-unblocked", { blockerId: userId.toString() });

        return res.status(200).json({ message: "Đã bỏ chặn người dùng thành công" });
    } catch (error) {
        console.error("Lỗi khi unblockUser:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const getBlockedUsers = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate("blockedUsers", "_id username displayName avatarURL bio");
        return res.status(200).json({ blockedUsers: user.blockedUsers || [] });
    } catch (error) {
        console.error("Lỗi khi getBlockedUsers:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
