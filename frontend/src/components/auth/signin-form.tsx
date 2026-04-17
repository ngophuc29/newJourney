import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { Input } from "@/components/ui/input"
import { Label } from "../ui/label"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuthStore } from "@/stores/useAuthStore"
import { useNavigate } from "react-router-dom"
const signInSchema = z.object({
   
  username: z.string().min(3, "Ten dang nhap co it nhat 3 ki tu"),
   
  password: z.string().min(6, "Password toi thieu 6 ki tu")


})

type SignInFormValues = z.infer<typeof signInSchema>

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) { 
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInFormValues>({
      resolver: zodResolver(signInSchema)
  });
  
  
  const navigate = useNavigate()

    const { signIn }= useAuthStore()
  
  
    const onSubmit = async (data: SignInFormValues) => {
  
      // goi api backend
      const { username, password } = data
      
      await signIn(username, password)
      navigate('/')
      console.log("hello");
      
    }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* header logo */}
              <div className="flex flex-col items-center text-center gap-2">

                <a href="/"
                  className="mx-auto block w-fit text-center"
                >
                  <img src="/logo.svg" alt="logo" />

                </a>

                <h1 className="text-2xl font-bold"> Chao mung ban quay lai</h1>
                <p className="text-muted-foreground text-balance">
                  Chao mung ban
                </p>
              </div>
               
              {/* username */}
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <Label htmlFor="username"
                    className="text-sm block"
                  >Ten dang nhap</Label>

                  <Input
                    type="text"
                    id="username"
                    placeholder="phucngo"
                    {...register("username")}

                  />
                  {errors.username && (
                    <p className="text-destructive text-sm">
                      {errors.username.message}
                    </p>
                  )}
                </div>


              </div>
               
              {/* password */}
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <Label htmlFor="password"
                    className="text-sm block">
                    Password
                  </Label>

                  <Input
                    type="text"
                    id="password"
                    placeholder="phucngo"
                    {...register("password")}

                  />
                  {errors.password && (
                    <p className="text-destructive text-sm">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>
              {/* nut dang nhap*/}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >Dang nhap
              </Button>

              <div className="text-center text-sm">
                Chua co tai khoan <a href="/signup"
                  className="underline underline-offset-4"
                >Dang ki</a>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}