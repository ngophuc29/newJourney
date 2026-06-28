import { SidebarInset } from "../ui/sidebar"
import ChatWindowHeader from "./ChatWindowHeader"



const ChatWelcomeScreen = () => {
    return (
        <SidebarInset className="flex w-full h-full bg-transparent">

            <ChatWindowHeader />
            <div className="flex bg-primary-foreground rounded-2xl flex-1 items-center justify-center">
                <div className="text-center">
                    <div className="size-40 mx-auto mb-6 bg-gradient-chat rounded-full
                    flex items-center justify-center shadow-glow pulse-ring
                    ">
                        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                            <img 
                                src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHBrYjBteDAybzh6ZW41MTZhZzdycGliZXFnMDlqdWx3bDhtNnQwcCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2IudUHdI075HL02Pkk/giphy.gif" 
                                alt="Welcome" 
                                className="w-full h-full object-fit"
                            />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-chat bg-clip-text text-gradient">
                        Chào mừng bạn đến với New Journey
                    </h2>
                    <p className="text-muted-foreground">Chọn một cuộc hội thoại để bắt đầu nhắn tin nào</p>
                </div>
            </div>

        </SidebarInset>
    )
}

export default ChatWelcomeScreen