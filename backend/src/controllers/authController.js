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
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ tất cả thông tin" })
        }

        const cleanFirstName = firstName.trim()
        const cleanLastName = lastName.trim()

        if (cleanFirstName.length < 1) {
            return res.status(400).json({ message: "Tên bắt buộc phải có" })
        }
        if (cleanLastName.length < 1) {
            return res.status(400).json({ message: "Họ bắt buộc phải có" })
        }
        if (username.length < 3) {
            return res.status(400).json({ message: "Tên đăng nhập phải có ít nhất 3 ký tự" })
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Email không hợp lệ" })
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Mật khẩu phải có ít nhất 8 ký tự" })
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
            displayName: `${cleanLastName} ${cleanFirstName}`

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

        const refreshToken = crypto.randomBytes(64).toString('hex')

        // tạo session để lưu refeshtoken

        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFESH_TOKEN_TTL)

        })

        // trả refeshtoken về cho clien thông qua cookie 
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // only secure in production (requires HTTPS)
            sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax", // allow local dev without cross-site restriction
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


export const signOut = async (req, res) => {
    try {
        // lấy refreshToken trong cookie
        const token = req.cookies?.refreshToken
        if (token) {

            // xóa refreshToken trong Session
            await Session.deleteOne({ refreshToken: token })
            // xóa refreshToken trong cookie
            res.clearCookie("refreshToken")
        }

        return res.sendStatus(204)
    } catch (error) {
        console.log("Lỗi khi gọi signOut", error);
        return res.status(500).json({ message: "Lỗi hệ thống" })

    }
}

export const refreshToken = async (req, res) => {
    try {
        // lay refresh token tu cookie
        const refreshToken = req.cookies?.refreshToken

        if (!refreshToken) {
            return res.status(401).json({ message: "khong ton tai RefreshToken" })
        }
        // so voi refreshtoken trong db
        const session = await Session.findOne({ refreshToken })
        if (!session) {
            return res.status(401).json({ message: "RefreshToken k hop le hoac da het han" })
        }
        // kiem tra het han chua
        if (session.expiresAt < new Date()) {
            return res.status(403).json({ message: "Token da het han" })
        }
        // tao access moi
        const accessToken = jwt.sign({
            userId: session.userId
        }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL })

        // return
        return res.status(200).json({ accessToken })
    } catch (error) {
        console.log("loi khi goi refresh token", error);
        return res.status(500).json({ message: "loi he thong" })
    }
}