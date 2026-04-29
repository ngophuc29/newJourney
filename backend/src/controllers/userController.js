import User from "../models/User.js"
export const authme = async (req, res) => {
    
    try {
        const user = req.user

        return res.status(200).json({
            user
        })
    } catch (error) {
        console.log("Lỗi khi gọi authMe", error);
        return res.status(500).json({ message: "Lỗi hệ thống" })

    }
    
}

export const searchUserbyUsername = async (req, res) => {
    try {
        const { username } = req.query
        
        if (!username || !username.trim() === "") {
            return res.status(400).json({
                message:"Can cung cap username"
            })
        }

        const user = await User.findOne({ username }).select("_id displayName userName avatarURL")
        
        return res.status(200).json({
            user
        })
    } catch (error) {
        console.log("Lỗi khi searchUserByUsername", error);
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}