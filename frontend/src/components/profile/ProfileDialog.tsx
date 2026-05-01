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
            <DialogContent className="overflow-y-auto max-h-[95vh] max-w-5xl w-full p-0 bg-background rounded-2xl border-none shadow-xl">

                <div className="p-6">
                    {/* Header */}
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold">
                            Profile & Settings
                        </DialogTitle>
                    </DialogHeader>

                    {/* Profile */}
                    <ProfileCard user={user} />

                    {/* Tabs - ✅ Ép flex-col để chia trên/dưới */}
                    <Tabs defaultValue="personal" className="flex flex-col w-full mt-6">

                        {/* ✅ Ép flex-row, w-full và h-auto để chống bị bóp méo */}
                        <TabsList className="flex flex-row w-full h-auto p-1.5 bg-muted rounded-2xl mb-4">

                            <TabsTrigger
                                value="personal"
                                className="flex-1 rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                            >
                                Tài Khoản
                            </TabsTrigger>

                            <TabsTrigger
                                value="preferences"
                                className="flex-1 rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                            >
                                Cấu Hình
                            </TabsTrigger>

                            <TabsTrigger
                                value="privacy"
                                className="flex-1 rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                            >
                                Bảo Mật
                            </TabsTrigger>

                        </TabsList>

                        {/* ✅ Content nằm dưới */}
                        <div className="w-full bg-background rounded-2xl p-6 border-none shadow-sm">

                            <TabsContent value="personal" className="mt-0 outline-none">
                                <PersonalInfoForm userInfo={user} />
                            </TabsContent>

                            <TabsContent value="preferences" className="mt-0 outline-none">
                                <PreferencesForm />
                            </TabsContent>

                            <TabsContent value="privacy" className="mt-0 outline-none">
                                <PrivacySettings />
                            </TabsContent>

                        </div>

                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileDialog;