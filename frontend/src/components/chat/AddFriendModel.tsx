import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { UserPlus } from "lucide-react";
import type { User } from "@/types/User";
import { useFriendStore } from "@/stores/useFriendStore";
import { useForm } from "react-hook-form";
import { data } from "react-router";
import { da } from "zod/v4/locales";
import { toast } from "sonner";
import SearchForm from "../AddFriendModel/SearchForm";
import SendFriendRequestForm from "../AddFriendModel/SendFriendRequestForm";

export interface IFormValues {
  username: string,
  message: string
}
const AddFriendModel = () => {

  const [isFound, setisFound] = useState<boolean | null>(null);
  const [searchUser, setsearchUser] = useState<User>();
  const [searchUserName, setsearchUserName] = useState('');
  const { loading, searchByUsername, addFriend } = useFriendStore()

  const {
    register, handleSubmit, watch, reset, formState: { errors }
  } = useForm<IFormValues>({
    defaultValues: { username: '', message: '' }
  })


  const userNameValue = watch('username')

  const handleSearch = handleSubmit(async (data) => {
    const username = data.username.trim()
    if (!username) return

    setisFound(null)
    setsearchUserName(username)

    try {
      const foundUser = await searchByUsername(username)
      if (foundUser) {
        setisFound(true)
        setsearchUser(foundUser)
      } else {
        setisFound(false)

      }
    } catch (error) {
      console.log(error);
      setisFound(false)

    }
  })

  const handleSend = handleSubmit(async (data) => {

    if (!searchUser) return

    try {
      const message = await addFriend(searchUser._id, data.message.trim())
      toast.success(message)
      reset()
      handleCancel()
    } catch (error) {
      console.log(error);

    }
  })
  const handleCancel = () => {
    reset()
    setsearchUserName("")
    setisFound(null)
  }

  return (
    <Dialog>
      <DialogTrigger >
        <div className="flex justify-center items-center size-5 rounded-full hover:bg-sidebar-accent cursor-pointer z-10">
          <UserPlus className="size-4" />
          <span className="sr-only"></span>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px] border-none">
        <DialogHeader>
          <DialogTitle>Ket ban</DialogTitle>
        </DialogHeader>

        {!isFound && <>
          <SearchForm
            register={register}
            errors={errors}
            usernameValue={userNameValue}
            loading={loading}
            isFound={isFound}
            searchedUsername={searchUserName}
            onCancel={handleCancel}
            onSubmit={handleSearch}

          />
        </>}

        {isFound && <>
          <SendFriendRequestForm
            register={register}
            loading={loading}
            searchedUsername={searchUserName}
            onSubmit={handleSend}
            onBack={()=>setisFound(null)}
          />
        </>}
      </DialogContent>
    </Dialog>
  )
}

export default AddFriendModel