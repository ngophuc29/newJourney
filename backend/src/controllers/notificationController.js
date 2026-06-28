import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .populate("senderId", "displayName avatarURL username");

        return res.status(200).json({ notifications });
    } catch (error) {
        console.error("Lỗi khi lấy thông báo:", error);
        return res.status(500).json({ message: "Lỗi hệ thống khi lấy thông báo" });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        if (notificationId === "all") {
            await Notification.updateMany({ userId, isRead: false }, { isRead: true });
            return res.status(200).json({ message: "Đã đọc tất cả thông báo" });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Không tìm thấy thông báo" });
        }

        return res.status(200).json({ notification });
    } catch (error) {
        console.error("Lỗi khi đánh dấu đã đọc thông báo:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });

        if (!notification) {
            return res.status(404).json({ message: "Không tìm thấy thông báo" });
        }

        return res.status(200).json({ message: "Đã xóa thông báo", notificationId });
    } catch (error) {
        console.error("Lỗi khi xóa thông báo:", error);
        return res.status(500).json({ message: "Lỗi hệ thống khi xóa thông báo" });
    }
};
