import express from "express"
import dotenv from "dotenv"
import { connectDB } from "./libs/db.js"

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5001

// middlewares
app.use(express.json)
// giup express hieu va doc dc request body
// duoi dang json

connectDB().then(() => {
    

})

app.listen(PORT, () => {
    console.log(`RUN NEWJOURNEY PORT ${PORT}`);

})