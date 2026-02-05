import { api } from "@/lib/axios";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export type MeResponse = {
  id: number;
  name: string;
  email: string;
  headline?: string;
  avatarUrl?: string | null;
};

export async function login(payload: LoginPayload) {
  const res = await api.post<LoginResponse>("/auth/login", payload);
  return res.data;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}

export async function getMe() {
  const res = await api.get<MeResponse>("/users/me");
  return res.data;
}
