import { SignupForm } from "@/components/auth/signup-form"
import SEO from "@/components/common/SEO"

const SignUpPage = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10 absolute inset-0 z-0 bg-gradient-purple">
      <SEO title="Đăng ký" description="Đăng ký tài khoản NewJourney để tham gia vào cộng đồng giới trẻ năng động và kết nối bạn bè." noIndex />
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  )
}

export default SignUpPage
