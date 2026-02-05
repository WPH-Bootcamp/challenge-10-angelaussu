"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { login, setToken } from "@/services/user.service";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !isSubmitting;
  }, [email, password, isSubmitting]);

  const validate = () => {
    let ok = true;
    setServerError(null);

    if (!email.trim()) {
      setEmailError("Email wajib diisi");
      ok = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Format email tidak valid");
      ok = false;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError("Password wajib diisi");
      ok = false;
    } else if (password.length < 6) {
      setPasswordError("Password minimal 6 karakter");
      ok = false;
    } else {
      setPasswordError(null);
    }

    return ok;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);

      const data = await login({
        email: email.trim(),
        password,
      });

      // simpan token
      setToken(data.token);

      window.dispatchEvent(new Event("auth:changed"));

      // redirect setelah login
      router.push("/");
      router.refresh();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setServerError("Email atau password salah");
      } else {
        setServerError("Terjadi kesalahan. Coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center px-6 md:px-0">
      <div className="w-full max-w-90 rounded-4xl border border-(--gray-alt-600) bg-white px-8 py-10 shadow-[0_0_24px_0_rgba(205,204,204,0.16)]">
        <h1 className="text-xl font-bold tracking-[-0.02em] text-(--black-alt)">
          Sign In
        </h1>

        <form
          onSubmit={onSubmit}
          className="mt-5 flex flex-row flex-wrap gap-y-5"
        >
          {/* Email */}
          <div className="w-full">
            <label className="mb-3 block text-sm font-semibold">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if (!email.trim()) setEmailError("Email is required.");
                else if (!isValidEmail(email))
                  setEmailError("Invalid email format.");
                else setEmailError(null);
              }}
              placeholder="Enter your email"
              className={`h-12 w-full rounded-[12px] py-2.5 px-4 border text-sm outline-none transition
              ${emailError ? "border-red-500" : "border-(--gray-alt) focus:border-(--blue-alt)"}`}
            />
            {emailError && (
              <p className="mt-2 text-sm text-red-500">Error Text Helper</p>
            )}
          </div>

          {/* Password */}
          <div className="w-full">
            <label className="mb-3 block text-sm font-semibold">Password</label>

            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => {
                  if (!password)
                    setPasswordError("Please enter your password.");
                  else if (password.length < 6)
                    setPasswordError(
                      "Password must be at least 6 characters long.",
                    );
                  else setPasswordError(null);
                }}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className={`h-12 w-full rounded-[12px] py-2.5 px-4 border  outline-none transition text-sm
                ${passwordError ? "border-red-500" : "border-(--gray-alt) focus:border-(--blue-alt)"}`}
              />

              {/* Toggle show/hide */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-5 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Image
                  src={showPassword ? "/hide.png" : "/eye.svg"}
                  alt="toggle password"
                  width={22}
                  height={22}
                />
              </button>
            </div>

            {passwordError && (
              <p className="mt-2 text-sm text-red-500">Error Text Helper</p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          {/* Button shadcn */}
          <Button
            type="submit"
            disabled={!canSubmit}
            className="h-12 w-full rounded-full text-lg font-semibold cursor-pointer bg-(--blue-alt)"
          >
            {isSubmitting ? "Loading..." : "Login"}
          </Button>

          <p className="text-center text-sm w-full text-(--black-alt-300)">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-(--blue-alt) hover:underline"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
