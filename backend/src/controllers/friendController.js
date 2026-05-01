import Friend from "../models/Friend.js"
import User from "../models/User.js"
import FriendRequest from "../models/FriendRequest.js"


export const sendFriendRequest = async (req, res) => {
    try {


        const { to, message } = req.body
        const from = req.user._id // user nay la tu setup tu middleware 

        if (from === to) {
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

        const friend = await Friend.create({
            userA: request.from,
            userB: request.to
        })

        await FriendRequest.findByIdAndDelete(requestId)

        const from = await User.findById(request.from).select("_id displayName avatarURL").lean()

        return res.status(201).json({
            message: "Chap nhan loi moi ket ban thanh cong",
            newFriend: {
                _id: from?._id,
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