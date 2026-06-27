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
const signUpSchema = z.object({
  firstname: z.string().min(1, "Tên bắt buộc phải có"),
  lastname: z.string().min(1, "Họ bắt buộc phải có"),
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự")
})

type SignUpFormValues = z.infer<typeof signUpSchema>
export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const navigate = useNavigate()
  const { signUp } = useAuthStore()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema)
  });



  const onSubmit = async (data: SignUpFormValues) => {
    const { firstname, lastname, username, password, email } = data
    try {
      await signUp(username, password, email, firstname, lastname)
      navigate("/signin")
    } catch (error) {
      console.error("Đăng ký thất bại:", error)
    }
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

                <h1 className="text-2xl font-bold"> Tạo tài khoản</h1>
                <p className="text-muted-foreground text-balance">
                  Chào mừng bạn tham gia cùng chúng tôi
                </p>
              </div>
              {/* ho va ten */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="lastname"
                    className="text-sm block"
                  >Họ</Label>

                  <Input
                    type="text"
                    id="lastname"
                    {...register("lastname")}
                  />

                  {errors.lastname && (
                    <p className="text-destructive text-sm">
                      {errors.lastname.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstname"
                    className="text-sm block"
                  >Tên</Label>

                  <Input
                    type="text"
                    id="firstname"
                    {...register("firstname")}

                  />
                  {errors.firstname && (
                    <p className="text-destructive text-sm">
                      {errors.firstname.message}
                    </p>
                  )}
                </div>
              </div>
              {/* username */}
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <Label htmlFor="username"
                    className="text-sm block"
                  >Tên đăng nhập</Label>

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
              {/* email */}
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <Label htmlFor="email"
                    className="text-sm block"
                  >Email</Label>

                  <Input
                    type="email"
                    id="email"
                    placeholder="m@gmail.com"
                    {...register("email")}

                  />
                  {errors.email && (
                    <p className="text-destructive text-sm">
                      {errors.email.message}
                    </p>
                  )}
                </div>


              </div>
              {/* password */}
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <Label htmlFor="password"
                    className="text-sm block">
                    Mật khẩu
                  </Label>

                  <Input
                    type="password"
                    id="password"
                    placeholder="••••••••"
                    {...register("password")}

                  />
                  {errors.password && (
                    <p className="text-destructive text-sm">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>
              {/* nut dang ky */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >Tạo tài khoản
              </Button>

              <div className="text-center text-sm">
                Đã có tài khoản <a href="/signin"
                  className="underline underline-offset-4"
                >Đăng nhập</a>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholderSignUp.png"
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
