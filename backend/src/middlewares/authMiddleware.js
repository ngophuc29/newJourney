import jwt from "jsonwebtoken"
import User from "../models/User.js"

// authorzation : xác minh được user là ai ?
export const protectedRoute = async (req,res,next) => {
    try {
        // Lấy token từ header
        const authHeader = req.headers.authorization
        const token = authHeader && authHeader.split(" ")[1] // Bearer <token>

        if (!token) {
            return res.status(401).json({
                message:"Khong tim thay access token nao"
            })
        }
        // Xác minh token có hợp lệ hay k
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
            if (err) {
                console.log(err);
                return res.status(403).json({
                    message:"Access token hết hạn hoặc k đúng"
                })
            }
            // lấy user
            const user = await User.findById(decodedUser.userId).select('-hashedPassword')
            if (!user) {
                return res.status(404).json({
                    message: "nguoi dung k ton tai "
                })
            }
            // trả user 
            req.user = user

            next()
        })
        

        
    } catch (error) {
        console.log("Lỗi khi xác minh auth middleware", error);
        return res.status(500).json({message:"Loi he thong"})
        
    }
}