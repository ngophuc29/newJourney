import Conversation from "../models/Conversation.js"
import Friend from "../models/Friend.js"


const pair =(a, b) => (a<b ? [a,b] : [b,a])
export const checkFriendShip = async (req,res,next) => {
    
    try {
        const me = req.user._id.toString()
        const recipientId = req.body?.recipientId ?? null;

        //cais nay la dùng khi tạo group nhé 
        const memberIds = req.body?.memberIds ?? []

        if (!recipientId && memberIds.length===0) {
            return res.status(400).json({ message:"can cung cap recipientId hoac memberIDs"})
        }

        if (recipientId) {
            const [userA, userB] = [me, recipientId]

            const isFriend = await Friend.findOne({ userA, userB })

            if (!isFriend) {
                return res.status(403).json({ message: "Ban chua ket ban voi nguoi nay" })
            }

            return next()
        }

        //setup cho chat group
        const friendChecks = memberIds.map(async (memberId) => {
            const [userA, userB] = pair(me, memberId)
            const friend = await Friend.findOne({ userA, userB })
            return friend? null : memberId
        })
        

        const results = await Promise.all(friendChecks)
        //do ở trên check nếu k phải bb thì trả về Id hàm filter này giúp lọc ra những người k phải bạn
        const notFriend = results.filter(Boolean)

        if (notFriend.length > 0) {
            return res.status(403).json({ message: "ban chi co the them ban be vao nhom ", notFriend })
        
        }
        next()

    } catch (error) {
        console.log("LOi xay ra khi check friendship", error);
        return res.status(500).json({message:"Loi he thong"})
        
    }
}