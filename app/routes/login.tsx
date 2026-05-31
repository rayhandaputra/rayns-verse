import { useState } from "react";
import {
  Form,
  Link,
  useActionData,
  useNavigate,
  useNavigation,
  useFetcher,
} from "react-router";
import {
  Eye,
  EyeOff,
  Check,
  Mail,
  Lock,
  ChevronLeft,
  AlertCircle,
  Phone,
  User,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { AuthAPI } from "~/nexus/modules/user_auth.server";
import { createUserSession } from "~/utils/session.server";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import type { ActionFunction } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { auth as firebaseAuth, googleProvider } from "~/lib/firebase.client";
import { signInWithPopup } from "firebase/auth";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const user_agent = request.headers.get("user-agent") || "unknown";

  if (intent === "google") {
    const email = formData.get("email") as string;
    const fullname = formData.get("fullname") as string;

    try {
      const result = await AuthAPI.loginWithGoogle({
        req: {
          body: {
            email,
            fullname,
            ip,
            user_agent,
          },
        },
      });

      if (result.success && result.token) {
        const user = result.user;

        // If customer needs registration (no phone), return data to show inline form
        if (result.needsRegistration) {
          return Response.json({
            needsRegistration: true,
            token: result.token,
            user,
          });
        }

        const redirectTo = user?.role === "customer"
          ? "/customer/dashboard"
          : "/app/overview";

        return createUserSession(result.token, redirectTo, JSON.stringify(user));
      }

      return Response.json(
        { error: result.message || "Login Google gagal" },
        { status: 400 }
      );
    } catch (error) {
      return Response.json({ error: "Gagal memproses login Google" }, { status: 500 });
    }
  }

  // Intent: complete_registration — finalize customer profile with phone
  if (intent === "complete_registration") {
    const token = formData.get("token") as string;
    const user_id = formData.get("user_id") as string;
    const fullname = formData.get("fullname") as string;
    const phone = formData.get("phone") as string;

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return Response.json({ error: "Nomor HP wajib diisi (minimal 10 digit)", needsRegistration: true }, { status: 400 });
    }

    const res = await AuthAPI.completeRegistration({
      session: { user: { id: user_id }, token },
      req: { body: { user_id, fullname, phone } },
    });

    if (!res.success) {
      return Response.json({ error: res.message, needsRegistration: true }, { status: 400 });
    }

    return createUserSession(token, "/customer/dashboard", JSON.stringify(res.user));
  }

  const email = formData.get("email");
  const password = formData.get("password");
  const rememberMe = formData.get("rememberMe") === "on";

  if (!email || typeof email !== "string") {
    return Response.json({ error: "Email wajib diisi" }, { status: 400 });
  }

  if (!password || typeof password !== "string") {
    return Response.json({ error: "Password wajib diisi" }, { status: 400 });
  }

  try {
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
      const user = result.user;
      const redirectTo = user?.role === "customer"
        ? (user?.phone ? "/customer/dashboard" : "/customer/register")
        : "/app/overview";

      return createUserSession(result.token, redirectTo, JSON.stringify(user));
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

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5 mr-2">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const actionData = useActionData<{ error?: string; needsRegistration?: boolean; token?: string; user?: any }>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const isSubmitting = navigation.state === "submitting" || fetcher.state === "submitting";

  // Registration state — shown after Google login if user has no phone
  const [regData, setRegData] = useState<{ token: string; user: any } | null>(null);

  // Check if fetcher returned needsRegistration
  const fetcherData = fetcher.data as any;
  const showRegistration = regData !== null || fetcherData?.needsRegistration;
  const registrationUser = regData?.user || fetcherData?.user;
  const registrationToken = regData?.token || fetcherData?.token;

  // Sync fetcher data to regData state
  if (fetcherData?.needsRegistration && !regData) {
    setRegData({ token: fetcherData.token, user: fetcherData.user });
  }

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;

      if (user.email) {
        fetcher.submit(
          {
            intent: "google",
            email: user.email,
            fullname: user.displayName || "",
            uid: user.uid
          },
          { method: "post" }
        );
      }
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      if (error.code !== "auth/popup-closed-by-user") {
        toast.error("Gagal login dengan Google. Silakan coba lagi.");
      }
    }
  };

  const isEmailValid = email.includes("@") && email.includes(".");

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden font-sans">
      <div className="hidden lg:flex lg:w-3/5 relative bg-[#103557] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 text-blue-400">
          <svg className="absolute top-0 right-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
            <circle cx="90" cy="10" r="30" fill="currentColor" />
            <circle cx="10" cy="90" r="40" fill="currentColor" />
          </svg>
        </div>

        <div className="relative z-10 text-center p-12 text-white max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img src="/kinau-logo.png" className="h-16 mx-auto mb-8 brightness-0 invert" alt="Kinau" />
            <h2 className="text-4xl font-extrabold mb-6 tracking-tight font-sans">Kreativitas Tanpa Batas Bersama Kinau</h2>
            <p className="text-lg text-blue-100/80 leading-relaxed font-light">
              Nikmati kemudahan mengelola pesanan, katalog produk, dan pantau proses produksi pesanan Anda secara real-time.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="text-2xl font-bold mb-1">10k+</div>
              <div className="text-[10px] text-blue-200 uppercase tracking-widest font-black">Pelanggan</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="text-2xl font-bold mb-1">50k+</div>
              <div className="text-[10px] text-blue-200 uppercase tracking-widest font-black">Produk</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="text-2xl font-bold mb-1">99%</div>
              <div className="text-[10px] text-blue-200 uppercase tracking-widest font-black">Kepuasan</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 md:p-12 bg-white relative">
        <div className="absolute top-6 left-6 lg:left-12">
          <Button
            variant="ghost"
            className="text-gray-500 hover:text-gray-900 group rounded-xl"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="w-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Kembali
          </Button>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-10 block lg:hidden text-center">
            <img src="/kinau-logo.png" className="h-10 mx-auto mb-4" alt="Kinau" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2 font-sans">
              {showRegistration
                ? "Lengkapi Profil Kamu"
                : !isAdminMode ? "Portal Pelanggan KINAU" : "Portal Staf & Admin"}
            </h1>
            <p className="text-gray-500 font-medium tracking-tight">
              {showRegistration
                ? "Satu langkah lagi sebelum mulai memesan. Isi nomor HP untuk menghubungkan pesananmu."
                : !isAdminMode
                  ? "Dapatkan akses cepat ke pemesanan ID Card, Lanyard, & cek status produksi Anda secara langsung."
                  : "Gunakan kredensial email & password Anda atau akses Google Staf untuk mengelola ERP."}
            </p>
          </div>

          {/* Registration Form — shown after Google login if phone is missing */}
          {showRegistration ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Form method="post" className="space-y-5">
                <input type="hidden" name="intent" value="complete_registration" />
                <input type="hidden" name="token" value={registrationToken || ""} />
                <input type="hidden" name="user_id" value={registrationUser?.id || ""} />

                {(actionData?.error && actionData?.needsRegistration) && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle size={16} />
                    {actionData.error}
                  </div>
                )}

                {/* Email — readonly */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Email (terverifikasi)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email"
                      value={registrationUser?.email || ""}
                      readOnly
                      className="w-full pl-12 pr-12 h-14 bg-gray-50 border-none rounded-2xl text-sm text-gray-600 font-bold cursor-not-allowed"
                    />
                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={16} />
                  </div>
                </div>

                {/* Nama */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      name="fullname"
                      defaultValue={registrationUser?.fullname || ""}
                      placeholder="Nama lengkap kamu"
                      className="w-full pl-12 pr-4 h-14 bg-gray-50 border-none rounded-2xl text-sm text-gray-900 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                {/* No HP */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Nomor HP / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="08xxxxxxxxxx"
                      className="w-full pl-12 pr-4 h-14 bg-gray-50 border-none rounded-2xl text-sm text-gray-900 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all outline-none"
                      required
                      inputMode="numeric"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5 ml-1">
                    Nomor ini digunakan untuk menghubungkan pesanan & notifikasi WhatsApp.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-[#103557] hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-blue-900/10 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </div>
                  ) : (
                    "Mulai Sekarang →"
                  )}
                </Button>
              </Form>
            </motion.div>
          ) : (
          <>
          <div className="mb-8">
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-14 rounded-2xl border-gray-100 text-gray-700 hover:bg-gray-50 flex items-center justify-center font-bold transition-all active:scale-[0.98] shadow-sm animate-pulse-once"
            >
              <GoogleIcon /> Lanjutkan dengan Google
            </Button>

            {isAdminMode && (
              <div className="relative my-8 text-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-100"></span>
                </div>
                <span className="relative px-4 bg-white text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Atau Akun Manual</span>
              </div>
            )}
          </div>

          {isAdminMode ? (
            <Form method="post" className="space-y-6">
              {actionData?.error && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <Alert variant="destructive" className="rounded-xl border-red-100 bg-red-50 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-bold">{actionData.error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-gray-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="nama@email.com"
                      defaultValue={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all text-gray-900 font-bold placeholder:text-gray-300"
                    />
                    {isEmailValid && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                          <Check className="h-3 w-3 text-white stroke-[4px]" />
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <Label htmlFor="password" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</Label>
                    <Link to="/forgot-password" size="sm" className="text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest">Lupa Password?</Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      defaultValue={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 h-14 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all text-gray-900 font-bold placeholder:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center px-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    className="w-5 h-5 border-gray-200 text-[#103557] focus:ring-[#103557] cursor-pointer shadow-sm rounded-md"
                  />
                  <span className="text-sm font-bold text-gray-400 select-none group-hover:text-gray-600 transition-colors">Tetap masuk di perangkat ini</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-[#103557] hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-blue-900/10 transition-all active:scale-[0.98] mt-4 uppercase tracking-widest text-xs"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sedang Masuk...</span>
                  </div>
                ) : (
                  "Masuk ke Dashboard"
                )}
              </Button>
            </Form>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-4 py-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Akses Tambahan</span>
              <button
                type="button"
                onClick={() => setIsAdminMode(true)}
                className="text-xs uppercase tracking-widest font-black text-[#103557] hover:text-[#0097B2] transition-all flex items-center gap-2 py-2 px-4 bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-[#103557]/10"
              >
                🔑 LOGIN MANUAL / SEBAGAI STAF
              </button>
            </div>
          )}

          <div className="mt-8 text-center space-y-3">
            {isAdminMode && (
              <button
                type="button"
                onClick={() => setIsAdminMode(false)}
                className="text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                ⬅️ Kembali ke Login Pelanggan
              </button>
            )}
            <p className="text-gray-400 font-bold text-sm">
              Belum punya akun? <Link to="/katalog" className="text-blue-600 font-black hover:underline">Lihat Katalog</Link> atau <Link to="/register" className="text-blue-600 font-black hover:underline">Hubungi Admin</Link>
            </p>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
