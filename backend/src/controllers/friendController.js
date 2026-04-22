import User from "../models/User.js"
 
import FriendRequest from "../models/FriendRequest.js"
import Friend from "../models/Friend.js"


export const send = async (req, res) => {
    try {

        const from = req.user._id
        const { to, message } = req.body

        if (from === to) {
            return res.status(400).json({ message: "ban k the tu gui loi moi cho ban than" })
        }

        const userExists = await User.exists({ _id: to })

        if (!userExists) {
            return res.status(400).json({ message: "Nguoi dung k ton tai" })

        }

        let userA = from.toString()
        let userB = to.toString()

        if (userA > userB) {
            [userA, userB] = [userB, userA]
        }

        const [alreadyFriend, existsRequest] = await Promise.all([
            Friend.findOne({ userA, userB }),
            FriendRequest.findOne({
                $or: [
                    {from,to}, {from :to,to :from}
                ]
            })
            
        ])

        if (alreadyFriend) {
            return res.status(404).json({ message: "Hai nguoi da la ban" })
        }

        if (existsRequest) {
            return res.status(404).json({ message: "Da gui loi moi truoc do " })

        }

        const request = await FriendRequest.create({
            from,to ,message
        })

        return res.status(200).json({
            message: "gui loi moi thanh cong ", request
        })

    } catch (error) {
        console.log("Loi xay ra khi gui loi moi ket ban", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}

export const acceptFriend = async (req, res) => {
    try {
        const { requestId } = req.params
        const userId = req.user._id

        
        const request = await FriendRequest.findById(requestId)

        if (!request) {
            return res.status(400).json({message:"Khong tim thay loi moi ket ban"})
        }

        if (request.to.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Ban k co quyen chap nhan loi moi" })

        }

        const acceptFriendFriend = await Friend.create({
            userA: request.from,
            userB: request.to
        })

        await FriendRequest.findByIdAndDelete(requestId)

        const newFriend = await User.findById(request.from).select('_id displayName avatarURL').lean()
        return res.status(201).json({
            message: "Ket ban thanh cong ", newFriend: {
                _id: newFriend?._id,
                displayName: newFriend?.displayName,
                avatarURL: newFriend?.avatarURL
            }})
    } catch (error) {
        console.log("Loi xay ra khi chap nhan loi moi ket ban", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}

export const declineFriend = async (req, res) => {
    try {
        const { requestId } = req.params
        const userId = req.user._id


        const request = await FriendRequest.findById(requestId)

        if (!request) {
            return res.status(400).json({ message: "Khong tim thay loi moi ket ban" })
        }

        if (request.to.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Ban k co quyen chap nhan loi moi" })

        }

    

        await FriendRequest.findByIdAndDelete(requestId)

        return res.status(201).json({
            message: "Huy ket ban thanh cong "
        })
    } catch (error) {
        console.log("Loi xay ra khi tu choi loi moi ket ban", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}

export const getAllFriend = async (req, res) => {
    try {
        const userId = req.user._id
        

        const friendShips = await Friend.find({
            $or: [
                {userA:userId}, {userB:userId}
            ]
        })
            .populate("userA", "_id displayName avatarURL")
            .populate("userB", "_id displayName avatarURL").lean()

        const friends = friendShips.map(
            (f) => {
                return f.userA._id.toString() === userId.toString() ? f.userB : f.userA
            }
        )

        return res.status(200).json({
            friends
        })
    } catch (error) {
        console.log("Loi khi lay danh sach ban be",error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}
export const getAllFriendRequest = async (req, res) => {
    try {
        const userId = req.user._id

        const populateFie = '_id displayName avatarURL'
        
        const [send, receive] = await Promise.all([
            FriendRequest.find({ from: userId }).populate('to', populateFie),
            FriendRequest.find({ to: userId }).populate('from', populateFie)

            
        ])

        return res.status(200).json({
            send ,receive
        })
    } catch (error) {
        console.log("Loi khi lay danh sach ban be", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}