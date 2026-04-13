import { useState } from "react";
import {
  Form,
  Link,
  useActionData,
  useNavigate,
  useNavigation,
} from "react-router";
import {
  Eye,
  EyeOff,
  Check,
  Mail,
  Lock,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { AuthAPI } from "~/lib/api/modules/user_auth";
import { createUserSession } from "~/lib/session.server";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import type { ActionFunction } from "react-router";

// export const meta: MetaFunction = () => {
//   return [
//     { title: "Login - Admin Dashboard" },
//     { name: "description", content: "Login to access your dashboard" },
//   ];
// };

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const rememberMe = formData.get("rememberMe") === "on";

  // Validate form inputs
  if (!email || typeof email !== "string") {
    return Response.json({ error: "Email wajib diisi" }, { status: 400 });
  }

  if (!password || typeof password !== "string") {
    return Response.json({ error: "Password wajib diisi" }, { status: 400 });
  }

  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const user_agent = request.headers.get("user-agent") || "unknown";

    const result = await AuthAPI.login({
      req: {
        body: {
          email,
          password,
          ip,
          user_agent,
        },
      },
    });

    if (result.success && result.token) {
      // Create session and redirect
      return createUserSession(result.token, "/app/overview", result.user);
    }

    return Response.json(
      { error: result.message || "Login gagal" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Login Error:", error);
    return Response.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 }
    );
  }
};

// Icon components for social login
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1DA1F2">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
  </svg>
);

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  // Check if email is valid for showing green check
  const isEmailValid = email.includes("@") && email.includes(".");

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 bg-gradient-to-br from-cyan-800 to-amber-50/50">
        <div className="max-w-lg">
          <img
            src="/images/login-illustration.png"
            alt="Welcome illustration"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="absolute left-3 top-3">
          <Button
            variant="ghost"
            className="text-gray-700"
            onClick={() => navigate(`/`)}
          >
            <ChevronLeft className="w-4" /> Kembali
          </Button>
        </div>
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-gray-800 font-serif italic">
              Login Admin
            </h1>
            <p className="text-gray-500 text-sm">
              Masuk untuk mengelola pesanan
            </p>
          </div>

          {/* Login Form */}
          <Form method="post" className="space-y-5">
            {/* Error Alert */}
            {actionData?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Log Masuk</AlertTitle>
                <AlertDescription>{actionData.error}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-600 text-sm">
                Email Adress
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="alexuiux7@gmail.com"
                  defaultValue={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-10 h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
                {isEmailValid && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-600 text-sm">
                Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  defaultValue={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  name="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                  className="border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Remember Me
                </Label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Forget Password?
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full transition-all"
              >
                {isSubmitting ? "Loading..." : "Masuk Dashbaord"}
              </Button>
              {/* <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 border-gray-300 text-gray-600 hover:bg-gray-50 font-medium rounded-full transition-all"
                asChild
              >
                <Link to="/register">Create Account</Link>
              </Button> */}
            </div>
          </Form>

          {/* Social Login */}
          {/* <div className="space-y-4">
            <div className="text-center">
              <span className="text-sm text-gray-400">
                Or you can join with
              </span>
            </div>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                aria-label="Login with Google"
              >
                <span className="text-white font-semibold text-sm">G+</span>
              </button>
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
                aria-label="Login with Facebook"
              >
                <FacebookIcon />
              </button>
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-sky-400 hover:bg-sky-500 flex items-center justify-center transition-colors"
                aria-label="Login with Twitter"
              >
                <TwitterIcon />
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
