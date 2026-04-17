import bcrypt from "bcrypt"
import User from "../models/User.js"

import jwt from "jsonwebtoken"
import Session from "../models/Session.js"
import crypto from "crypto"
const ACCESS_TOKEN_TTL = '30m'
const REFESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000 // 14 ngayf

export const test = () => {
    console.log("test route auth");

}
export const signUp = async (req, res) => {

    try {
        const { username, password, email, firstName, lastName } = req.body

        if (!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json(
                { message: "Khong the thieu username, password, email, firstName, lastName " }
            )
        }

        // kiểm tra user đã tồn tại chưa
        const duplicate = await User.findOne({ username })

        if (duplicate) {
            return res.status(409).json({ message: "Username đã tồn tại" })
        }
        // mã hóa pasword
        const hashedPassword = await bcrypt.hash(password, 10) // salt =10
        // tạo user mới


        const newUser = await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${firstName} ${lastName}`

        })

        return res.status(201).json({
            message: "Tạo user thành công ",
            user: newUser
        })
    } catch (error) {
        console.log("Lỗi khi tạo tài khoản", error);
        return res.status(500).json({ message: "Lỗi hệ thống" })

    }

}

export const signIn = async (req, res) => {

    try {
        //lấy input
        const { username, password } = req.body


        if (!username || !password) {
            return res.status(400).json({ message: "Thiếu username hoặc password" })
        }

        const user = await User.findOne({ username })

        if (!user) {
            return res.status(401).json({ message: "username hoặc password k chính xác" })
        }
        // lấy hashpassword trong db để so sánh với password input
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword)

        if (!passwordCorrect) {
            return res.status(401).json({ message: "username hoặc password k chính xác" })

        }
        //tạo accessToken với JWT

        const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL })
        // tạo refeshtoken

        const refeshToken = crypto.randomBytes(64).toString('hex')

        // tạo session để lưu refeshtoken

        await Session.create({
            userId: user._id,
            refeshToken,
            expiresAt: new Date(Date.now() + REFESH_TOKEN_TTL)

        })

        // trả refeshtoken về cho clien thông qua cookie 
        res.cookie('refeshToken', refeshToken, {
            httpOnly: true,
            secure: true, // đảm bảo chi gửi qua http
            sameSite: "none", // be và fe deploy riêng,
            maxAge: REFESH_TOKEN_TTL

        })

        // trả accessToken về trong res

        return res.status(200).json({
            message: `User ${user.displayName} đã loging thành công`,
            accessToken
        })
    } catch (error) {
        console.log("Lỗi khi đăng nhập tài khoản", error);
        return res.status(500).json({ message: "Lỗi hệ thống" })

    }
}


export const signOut = async(req, res) => {
    try {
        // lấy refeshToken trong cookie
        const token = req.cookie?.refeshToken
        if (token) {

            // xóa refeshToken trong Session
            await Session.deleteOne({ refeshToken: token })
            // xóa refeshToken trong cookie
            res.clearCookie("refeshToken")
        }

        return res.sendStatus(204)
    } catch (error) {
        console.log("Lỗi khi gọi signOut", error);
        return res.status(500).json({ message: "Lỗi hệ thống" })

    }
}