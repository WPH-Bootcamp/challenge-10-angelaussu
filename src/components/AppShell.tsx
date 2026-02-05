"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const HIDE_SHELL_ROUTES = ["/login", "/register"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // hide navbar/footer di halaman tertentu
  const hideShell =
    HIDE_SHELL_ROUTES.includes(pathname) || pathname.startsWith("/auth/");

  if (hideShell) return <main>{children}</main>;

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
