import Conversation from "../models/Conversation.js"
import Friend from "../models/Friend.js"


const pair =(a, b) => (a<b ? [a,b] : [b,a])
export const checkFriendShip = async (req,res,next) => {
    
    try {
        const me = req.user._id.toString()
        const recipientId = req.body?.recipientId ?? null;

        if (!recipientId) {
            return res.status(400).json({ message:"can cung cap recipientId"})
        }

        if (recipientId) {
            const [userA, userB] = [me, recipientId]

            const isFriend = await Friend.findOne({ userA, userB })

            if (!isFriend) {
                return res.status(403).json({ message: "Ban chua ket ban voi nguoi nay" })
            }

            return next()
        }

        //chat gr
        
    } catch (error) {
        console.log("LOi xay ra khi check friendship", error);
        return res.status(500).json({message:"Loi he thong"})
        
    }
}