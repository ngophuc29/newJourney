export const autme = async (req, res) => {
    
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

// Build Hệ Thống Xác Thực Người Dùng JWT | Dự án Moji(Phần 1)
// 55:17