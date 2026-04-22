import mongoose from "mongoose";

const friendSchema = new mongoose.Schema({
    userA: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    }
    ,
    userB: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
})

friendSchema.pre('save', function () {
    const a = this.userA.toString()
    const b= this.userB.toString()

    if (a > b) {
        this.userA = mongoose.Schema.Types.ObjectId(b)
        this.userB= mongoose.Schema.Types.ObjectId(a)

    }
})
const Friend = mongoose.model("Friend", friendSchema)
export default Friend