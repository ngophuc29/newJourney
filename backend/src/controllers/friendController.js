import Friend from "../models/Friend.js"
import FriendRequest from "../models/FriendRequest.js"
import User from "../models/User.js"
export const send = async (req,res) => {
    try {

        const from = req.user._id
        const { to, message } = req.body

        if (from === to) {
            return res.status(400).json({ message: "Ban k the ket ban voi chinh minh" })


        }

        const userExists = await User.exists({ _id: to })
        if (!userExists) {
            return res.status(404).json({ message: "Nguoi dung k ton tai" })
        }

        let userA = from.toString()
        let userB = to.toString()

        if (userA > userB) {
            [userA, userB] = [userB, userA]
        }


        const [alreadyFriend, existsRequest] = await Promise.all([
            Friend.findOne({ userA, userB }),
            FriendRequest.findOne({
                $or:[{from,to},{from:to,to:from}]
            })
        ])

        if (alreadyFriend) {
            return res.status(404).json({message:"Hai nguoi da la ban"})
        }

        if (existsRequest) {
            return res.status(404).json({ message: "Da gui loi moi truoc do " })

        }

        const request = await FriendRequest.create({ from, to, message })
        return res.status(200).json({
            message: "gui loi moi thanh cong ", request
        })
    } catch (error) {
        console.log("Loi xay ra khi gui loi moi ket ban",error);
        return res.status(500).json({ message: "Loi he thong" })

    }
}

export const acceptFriend = async (req, res) => {
    try {

        const {requestId}= req.params
        const userId = req.user._id
        
        const request = await FriendRequest.findById(requestId)

        if (!request) {
            return res.status(404).json({message:"Loi moi ket ban k torn tai"})
        }

        if (request.to.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Ban k the tu chap nhan loi moi ket ban" })

        }


        const friend = await Friend.create({
            userA: request.from,
            userB:request.to
        })


        await FriendRequest.findByIdAndDelete(request)
        const newFriend = await User.findById(request.from).select("_id displayName avatarURL").lean()

        return res.status(200).json({
            message: "Loi moi ket ban duoc chap nhan",
            newFriend: {
                _id: newFriend?._id,
                displayName: newFriend?.displayName,
                avatarURL:newFriend?.avatarURL
            }
        })
    } catch (error) {
        console.log("Loi xay ra chap nhan loi moi ket ban", error);
        return res.status(500).json({ message: "Loi he thong" })

    }
}

export const declineFriend = async (req, res) => {
    try {

        const { requestId } = req.params
        const userId = req.user._id

        const request = await FriendRequest.findById(requestId)

        if (!request) {
            return res.status(404).json({ message: "Loi moi ket ban k torn tai" })
        }

        if (request.to.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Ban k the tu chap nhan loi moi ket ban" })

        }


        await FriendRequest.findByIdAndDelete(requestId)
         

        return res.status(200).json({
            message: "Tu choi loi moi thanh cong",
           
        })
    } catch (error) {
        console.log("Loi xay ra tu choi loi moi ket ban", error);
        return res.status(500).json({ message: "Loi he thong" })

    }
}