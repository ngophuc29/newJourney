import mongoose from 'mongoose'

const friendRequestSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    },
     to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
     message: {
         type: String,
      maxlength:300   
     }
})

friendRequestSchema.index({ from: 1, to: 1 }, { unique: 1 })
friendRequestSchema.index({ from: 1 })
friendRequestSchema.index({ to: 1 })

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema)
export default FriendRequest
