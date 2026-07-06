import Friend from "../models/Friend.js"
import User from "../models/User.js"
import FriendRequest from "../models/FriendRequest.js"
import Notification from "../models/Notification.js"
import Follow from "../models/Follow.js"
import { io } from "../socket/index.js"


export const sendFriendRequest = async (req, res) => {
    try {


        const { to, message } = req.body
        const from = req.user._id // user nay la tu setup tu middleware 

        if (!to) {
            return res.status(400).json({ message: "Thieu nguoi nhan loi moi ket ban" })
        }

        if (from.toString() === to?.toString()) {
            return res.status(400).json({ message: "Khong the gui loi moi ket ban cho chinh minh" })

        }

        const userExist = await User.exists({ _id: to })

        if (!userExist) {
            return res.status(404).json({ message: "Nguoi dung k ton tai" })

        }

        let userA = from.toString()
        let userB = to.toString()


        if (userA > userB) {
            [userA, userB] = [userB, userA]
        }


        const [alreadyFriends, existingRequest] = await Promise.all([
            Friend.findOne({ userA, userB }),
            FriendRequest.findOne({
                $or: [
                    { from, to },
                    { from: to, to: from }
                ]
            })
        ])


        if (alreadyFriends) {
            return res.status(400).json({ message: "Hai nguoi da la ban be" })
        }

        if (existingRequest) {
            return res.status(400).json({ message: "Da co loi moi ket ban dang cho" })
        }


        const request = await FriendRequest.create({
            from, to, message
        })
        await request.populate([
            { path: "from", select: "_id username displayName avatarURL" },
            { path: "to", select: "_id username displayName avatarURL" }
        ])

        // Create DB notification
        const notification = await Notification.create({
            userId: to,
            type: "friend_request",
            senderId: from,
            relatedId: request._id
        });
        const populatedNotification = await notification.populate("senderId", "displayName avatarURL username");
        
        io.to(to.toString()).emit("friend-request-received", { request })
        io.to(to.toString()).emit("new-notification", { notification: populatedNotification })
        io.to(from.toString()).emit("friend-request-sent", { request })

        return res.status(201).json({
            message: "Gui loi moi ket ban thanh cong", request
        })
    } catch (error) {
        console.log("Loi khi gui loi moi ket ban");
        return res.status(500).json({ message: "Loi he thong" })
    }
}

export const acceptFriend = async (req, res) => {
    try {
        const { requestId } = req.params
        const userId = req.user._id

        const request = await FriendRequest.findById(requestId)

        if (!request) {
            return res.status(404).json({ message: "Khong tim thay loi moi ket ban" })
        }

        if (request.to.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Ban k co quyen chap nhan loi moi nay" })
        }

        await Friend.create({
            userA: request.from,
            userB: request.to
        })

        // Tự động tạo follow chéo khi kết bạn thành công
        await Follow.insertMany([
            { followerId: request.from, followingId: request.to },
            { followerId: request.to, followingId: request.from }
        ], { ordered: false }).catch(err => {
            if (err.code !== 11000) {
                console.error("Loi khi tu dong follow cheo:", err.message);
            }
        });

        await FriendRequest.findByIdAndDelete(requestId)

        const from = await User.findById(request.from).select("_id username displayName avatarURL").lean()
        const acceptedBy = await User.findById(request.to).select("_id username displayName avatarURL").lean()

        io.to(request.from.toString()).emit("friend-request-accepted", {
            requestId,
            friend: acceptedBy
        })
        io.to(request.to.toString()).emit("friend-request-accepted-self", {
            requestId,
            friend: from
        })

        return res.status(201).json({
            message: "Chap nhan loi moi ket ban thanh cong",
            newFriend: {
                _id: from?._id,
                username: from?.username,
                displayName: from?.displayName,
                avatarURL: from?.avatarURL
            }
        })



    } catch (error) {
        console.log("Loi khi chap nhan loi moi ket ban", error);
        return res.status(500).json({ message: "Loi he thong" })

    }
}

export const deniedFriend = async (req, res) => {
    try {
        const { requestId } = req.params
        const userId = req.user._id

        const request = await FriendRequest.findById(requestId)

        if (!request) {
            return res.status(404).json({ message: "Khong tim thay loi moi ket qua" })

        }
        if (request.to.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Ban k co quyen chap nhan loi moi nay" })
        }

        await FriendRequest.findByIdAndDelete(requestId)

        io.to(request.from.toString()).emit("friend-request-declined", {
            requestId,
            userId: request.to.toString()
        })
        io.to(request.to.toString()).emit("friend-request-declined-self", {
            requestId,
            userId: request.from.toString()
        })

        return res.status(200).json({
            message: "Tu choi loi moi ket ban thanh cong"
        })

    } catch (error) {
        console.log("Loi khi tu choi loi moi ket ban");
        return res.status(500).json({ message: "Loi he thong" })

    }
}

//31:51
export const getAllFriend = async (req, res) => {
    try {
        const userId = req.user._id
        const friendships = await Friend.find({
            $or: [
                { userA: userId }, { userB: userId }
            ]
        })
            .populate("userA", "_id username displayName avatarURL")
            .populate("userB", "_id username displayName avatarURL").lean()


        if (friendships.length == 0) {
            return res.status(200).json({ friends: [] })
        }

        const friends = friendships.map((f) => f.userA._id.toString() === userId.toString() ? f.userB : f.userA)

        return res.status(200).json({ friends })

    } catch (error) {
        console.log("Loi khi lay danh sach ban be");
        return res.status(500).json({ message: "Loi he thong" })

    }
}

export const removeFriend = async (req, res) => {
    try {
        const userId = req.user._id
        const { friendId } = req.params

        if (!friendId) {
            return res.status(400).json({ message: "Thieu friendId" })
        }

        let userA = userId.toString()
        let userB = friendId.toString()

        if (userA > userB) {
            [userA, userB] = [userB, userA]
        }

        const friendship = await Friend.findOneAndDelete({ userA, userB })

        if (!friendship) {
            return res.status(404).json({ message: "Hai nguoi chua la ban be" })
        }

        // Tự động xóa follow chéo khi hủy kết bạn
        await Follow.deleteMany({
            $or: [
                { followerId: userId, followingId: friendId },
                { followerId: friendId, followingId: userId }
            ]
        }).catch(err => console.error("Loi khi xoa follow cheo:", err.message));

        io.to(userId.toString()).emit("friend-removed", { friendId })
        io.to(friendId.toString()).emit("friend-removed", { friendId: userId.toString() })

        return res.status(200).json({ message: "Da xoa ban be thanh cong" })
    } catch (error) {
        console.log("Loi khi xoa ban be", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}

export const getNonFriendUsers = async (req, res) => {
    try {
        const userId = req.user._id

        const friendships = await Friend.find({
            $or: [
                { userA: userId }, { userB: userId }
            ]
        }).lean()

        const friendIds = friendships.map((f) =>
            f.userA.toString() === userId.toString() ? f.userB : f.userA
        )

        const users = await User.find({
            _id: { $nin: [userId, ...friendIds] }
        })
            .select("_id username displayName avatarURL")
            .sort({ displayName: 1, username: 1 })
            .lean()

        const userIds = users.map((u) => u._id)
        const pendingRequests = await FriendRequest.find({
            $or: [
                { from: userId, to: { $in: userIds } },
                { from: { $in: userIds }, to: userId }
            ]
        }).lean()

        const requestStatusByUser = new Map()
        pendingRequests.forEach((request) => {
            const isSent = request.from.toString() === userId.toString()
            const otherUserId = isSent ? request.to.toString() : request.from.toString()
            requestStatusByUser.set(otherUserId, isSent ? "sent" : "received")
        })

        const suggestedUsers = users.map((user) => ({
            ...user,
            friendRequestStatus: requestStatusByUser.get(user._id.toString()) ?? null
        }))

        return res.status(200).json({ users: suggestedUsers })
    } catch (error) {
        console.log("Loi khi lay danh sach nguoi dung chua ket ban", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}

export const getFriendRequest = async (req, res) => {
    try {
        const userId = req.user._id

        const populateFields = '_id username displayName avatarURL'
        
        const [sent, received] = await Promise.all([
            FriendRequest.find({ from: userId }).populate('to', populateFields),// loi moi gui di 
            FriendRequest.find({ to: userId }).populate('from', populateFields),// loi moi nhan duoc
        ])

        return res.status(200).json({sent,received})
    } catch (error) {
        console.log("Loi khi lay danh sach loi moi ket ban",error);
        return res.status(500).json({ message: "Loi he thong" })

    }
}
