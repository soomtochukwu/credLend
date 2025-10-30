"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-hot-toast";

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const next = searchParams.get("next") || "/home";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/users/auth/login/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        }
      );

      const data = await res.json();

      if (res.ok && data.tokens) {
        localStorage.setItem("accessToken", data.tokens.access);
        localStorage.setItem("refreshToken", data.tokens.refresh);

        toast.success("Login successful!");
        router.push(next);
      } else {
        toast.error(data.error || data.detail || "Invalid credentials");
      }
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 pt-10 relative">
      <div className="w-full mx-auto" style={{ maxWidth: "420px" }}>

        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-6 sm:mt-0">
          Welcome Back
        </h1>
        <p className="text-sm text-gray-500 mt-1">You have been missed</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-gray-600 mb-2 block">
              Email address
            </label>
            <input
              required
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) =>
                setForm((s) => ({ ...s, email: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cred-teal)]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-2 block">Password</label>
            <div className="relative">
              <input
                required
                type={show ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) =>
                  setForm((s) => ({ ...s, password: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 p-4 text-sm pr-12 focus:outline-none focus:ring-2 focus:ring-[var(--cred-teal)]"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {show ? (
                  <AiOutlineEyeInvisible size={18} />
                ) : (
                  <AiOutlineEye size={18} />
                )}
              </button>
            </div>

            <div className="text-right mt-2">
              <button
                type="button"
                onClick={() => router.push("/forgot")}
                className="text-sm text-[var(--cred-teal)]"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full mt-2 rounded-lg py-4 text-white font-medium shadow-md"
            style={{
              background: "linear-gradient(180deg, #14B9B5 0%, #0ea79b 100%)",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="flex items-center my-2">
            <div className="flex-1 h-px bg-gray-200" />
            <div className="px-3 text-xs text-gray-400">OR</div>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            className="w-full border border-[var(--cred-teal)] rounded-xl py-3 flex items-center justify-center gap-3 text-sm"
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          <div className="text-center mt-6 text-sm text-gray-500">
            Don’t have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="text-[var(--cred-teal)] underline"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
