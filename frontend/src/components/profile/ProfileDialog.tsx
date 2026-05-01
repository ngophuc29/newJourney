import type { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import ProfileCard from "./ProfileCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import PersonalInfoForm from "./PersonalInfoForm";
import PreferencesForm from "./PreferencesForm";
import PrivacySettings from "./PrivacySettings";

interface ProfileDialogProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

const ProfileDialog = ({ open, setOpen }: ProfileDialogProps) => {
    const { user } = useAuthStore();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-y-auto max-h-[95vh] max-w-5xl w-full p-0 bg-background rounded-2xl border shadow-xl">

                <div className="p-6">
                    {/* Header */}
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold">
                            Profile & Settings
                        </DialogTitle>
                    </DialogHeader>

                    {/* Profile */}
                    <ProfileCard user={user} />

                    {/* Tabs */}
                    <Tabs defaultValue="personal" className="mt-6">
                        <div className="grid grid-cols-4 gap-6">

                            {/* ✅ Sidebar (vẫn dùng TabsList) */}
                            <TabsList className="col-span-1 flex flex-col h-fit bg-muted/40 rounded-xl p-2 space-y-1">

                                <TabsTrigger
                                    value="personal"
                                    className="w-full justify-start px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
                                >
                                    Tài Khoản
                                </TabsTrigger>

                                <TabsTrigger
                                    value="preferences"
                                    className="w-full justify-start px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
                                >
                                    Cấu Hình
                                </TabsTrigger>

                                <TabsTrigger
                                    value="privacy"
                                    className="w-full justify-start px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
                                >
                                    Bảo Mật
                                </TabsTrigger>

                            </TabsList>

                            {/* ✅ Content */}
                            <div className="col-span-3 bg-background rounded-xl p-6 border shadow-sm">

                                <TabsContent value="personal">
                                    <PersonalInfoForm userInfo={user} />
                                </TabsContent>

                                <TabsContent value="preferences">
                                    <PreferencesForm />
                                </TabsContent>

                                <TabsContent value="privacy">
                                    <PrivacySettings />
                                </TabsContent>

                            </div>

                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileDialog;