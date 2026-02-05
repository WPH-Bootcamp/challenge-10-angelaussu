"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type FieldErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword", string>
>;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function pickErrorMessage(payload: any): string {
  const raw = payload?.error ?? payload;

  const msg =
    (typeof raw === "string" && raw) ||
    raw?.message ||
    raw?.error ||
    raw?.detail ||
    JSON.stringify(raw);

  const lower = String(msg).toLowerCase();

  if (
    lower.includes("email") &&
    (lower.includes("taken") ||
      lower.includes("exist") ||
      lower.includes("already") ||
      lower.includes("terdaftar") ||
      lower.includes("sudah"))
  ) {
    return "Email is already registered.";
  }

  return "Registration failed. Please check your input or try again.";
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const username = useMemo(() => {
    return email.split("@")[0]?.trim() || "";
  }, [email]);

  function validate(): boolean {
    const e: FieldErrors = {};
    setServerError("");
    setSuccessMsg("");

    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!isValidEmail(email.trim())) e.email = "Invalid email format";

    if (!password) e.password = "Password is required";
    else if (password.length < 8)
      e.password = "Password must be at least 8 characters long";

    if (!confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (confirmPassword !== password)
      e.confirmPassword = "Passwords do not match";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");
    setSuccessMsg("");

    try {
      const payload = {
        name: name.trim(),
        username: username || name.trim().toLowerCase().replace(/\s+/g, ""),
        email: email.trim(),
        password,
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServerError(pickErrorMessage(data));
        return;
      }

      setSuccessMsg("Registration successful. Please log in.");
      setTimeout(() => router.push("/login"), 600);
    } catch {
      setServerError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 md:px-0">
      <div className="w-full max-w-90 bg-white rounded-xl shadow-[0_0_24px_0_rgba(205,204,204,0.16)] border border-gray-200 p-6">
        <h1 className="text-xl font-bold tracking-[-0.02em] text-(--black-alt)">
          Sign Up
        </h1>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-5">
          {/* NAME */}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              className={`h-12 w-full rounded-[12px] px-4 border outline-none text-sm
              ${
                errors.name
                  ? "border-red-400"
                  : "border-gray-200 focus:border-blue-500"
              }`}
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className={`h-12 w-full rounded-[12px] px-4 border outline-none text-sm
              ${
                errors.email
                  ? "border-red-400"
                  : "border-gray-200 focus:border-blue-500"
              }`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`h-12 w-full rounded-[12px] px-4 pr-12 border outline-none text-sm
                ${
                  errors.password
                    ? "border-red-400"
                    : "border-gray-200 focus:border-blue-500"
                }`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 cursor-pointer"
              >
                <Image
                  src={showPassword ? "/hide.png" : "/eye.svg"}
                  alt="toggle password"
                  width={22}
                  height={22}
                />
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className={`h-12 w-full rounded-[12px] px-4 pr-12 border outline-none text-sm
                ${
                  errors.confirmPassword
                    ? "border-red-400"
                    : "border-gray-200 focus:border-blue-500"
                }`}
                placeholder="Enter your confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 cursor-pointer"
              >
                <Image
                  src={showConfirm ? "/hide.png" : "/eye.svg"}
                  alt="toggle confirm password"
                  width={22}
                  height={22}
                />
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-(--blue-alt) py-3 text-sm font-semibold text-white disabled:opacity-70 h-12 cursor-pointer"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          <p className="text-center text-sm text-(--black-alt-300)">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-(--blue-alt) hover:underline font-bold cursor-pointer"
            >
              Log in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
