import mongoose from "mongoose"

export const connectDB = async () => {
    
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTION)
        console.log("CONNECT SUCCESSFULL TO DB");
        
    } catch (error) {
        console.log("FAIL TO CONNECT", error)
            process.exit(1)
        
    }
}