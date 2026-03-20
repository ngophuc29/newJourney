import mongoose from "mongoose";

const userScherma = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase : true
    },
    hashedPassword: {
        type: String,
        required : true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    }
    , 
    displayName: {
        type: String,
        required: true,
        trim : true 
        
    }
    ,
    avatarURL: {
        type:String
    },
    avatarID: {
        type : String
    },
    bio: {
        type: String ,
        maxlength : 500
    },
    phone: {
        type: String,
        sparse : true // cho phép null nhưng k dc trùng
    }
}, {
    timestamps: true 

})

const User = mongoose.model("User", userScherma)
export default User