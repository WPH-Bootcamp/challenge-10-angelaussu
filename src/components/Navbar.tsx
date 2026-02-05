"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Search, Menu, X, User } from "lucide-react";
//  tambah 2 import ini
import { usePathname, useRouter } from "next/navigation";
//  tambah icon arrow
import { ArrowLeft } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  getMe,
  type MeResponse,
  clearToken,
  getToken,
} from "@/services/user.service";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const [token, setTokenState] = useState<string | null>(null);
  const [me, setMeState] = useState<MeResponse | null>(null);

  const isLoggedIn = useMemo(() => !!token, [token]);

  //  tambah ini
  const pathname = usePathname();
  const router = useRouter();
  const isWritePostPage = pathname === "/write-post";

  const fetchMe = async () => {
    try {
      const data = await getMe();
      setMeState(data);
    } catch {
      clearToken();
      setTokenState(null);
      setMeState(null);
    }
  };

  // state
  const [searchText, setSearchText] = useState("");

  // submit
  const submitSearch = () => {
    const query = searchText.trim();
    if (!query) return;
    router.push(`/search?query=${encodeURIComponent(query)}&page=1`);
  };

  useEffect(() => {
    const t = getToken();
    setTokenState(t);
    if (t) fetchMe();
    else setMeState(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = () => {
      const t = getToken();
      setTokenState(t);
      if (t) fetchMe();
      else setMeState(null);
    };

    window.addEventListener("auth:changed", handler);
    return () => window.removeEventListener("auth:changed", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tutup mobile menu kalau user login
  useEffect(() => {
    if (isLoggedIn) setOpen(false);
  }, [isLoggedIn]);

  // Lock body scroll saat mobile menu kebuka
  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", open);
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  const onLogout = () => {
    clearToken();
    setTokenState(null);
    setMeState(null);
    setOpen(false);
    window.dispatchEvent(new Event("auth:changed"));
  };

  const displayName = me?.name || "User";
  const avatarSrc = me?.avatarUrl || "/author.png";

  const closeMobileMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D5D7DA] bg-white">
      <div className="mx-auto max-w-300 px-4 md:px-6 lg:px-10 xl:px-0">
        {/*  mode khusus /write-post */}
        {isWritePostPage ? (
          <div className="flex h-20 items-center justify-between">
            {/* Left: back + title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Back"
                className="inline-flex h-10 w-10 items-center justify-center cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <span className="text-base font-semibold text-(--black-alt)">
                Write Post
              </span>
            </div>

            {/* Right: avatar + name (kalau login) */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-200">
                  <Image
                    src={avatarSrc}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-sm font-semibold text-(--black-alt)">
                  {displayName}
                </span>
              </div>
            ) : (
              <Button variant="link" asChild className="text-sm font-semibold">
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex h-20 items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={closeMobileMenu}
            >
              <Image
                src="/blog-logo.svg"
                alt="Logo"
                width={158}
                height={36}
                className="h-9 w-39.5"
                priority
              />
            </Link>

            {/* Search - Desktop */}

            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Input
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitSearch();
                  }}
                  className="h-12 rounded-xl border border-(--gray-alt) py-3 pl-12 pr-3 placeholder-[#717680]
             focus-visible:ring-1 focus-visible:ring-[#0093DD] focus-visible:ring-offset-0
             focus-visible:outline-none"
                />
                <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-(--gray-alt-dark)" />
              </div>
            </div>

            {/* Right - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {!isLoggedIn ? (
                <>
                  <Button
                    variant="link"
                    asChild
                    className="mr-3 rounded-none border-r border-(--gray-alt) pr-6 text-sm font-semibold text-(--blue-alt) underline"
                  >
                    <Link href="/login">Login</Link>
                  </Button>

                  <Button
                    asChild
                    className="h-11 rounded-full bg-(--blue-alt) px-16 text-sm font-semibold text-white hover:bg-(--blue-alt)/90"
                  >
                    <Link href="/register">Register</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="link"
                    asChild
                    className="text-sm font-semibold text-(--blue-alt)"
                  >
                    <Link
                      href="/write-post"
                      className="flex items-center gap-2 p-0 underline"
                    >
                      <Image
                        src="/write-post.svg"
                        alt="Write"
                        width={20}
                        height={20}
                      />
                      Write Post
                    </Link>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="group flex items-center gap-3 rounded-md outline-none cursor-pointer"
                      >
                        <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-200">
                          <Image
                            src={avatarSrc}
                            alt={displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-sm font-semibold text-(--black-alt)">
                          {displayName}
                        </span>
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-4 py-3 cursor-pointer"
                        >
                          <Image
                            src="/user.svg"
                            alt="Profile"
                            width={20}
                            height={20}
                          />
                          Profile
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={onLogout}
                        className="flex cursor-pointer items-center gap-2 px-4 py-3"
                      >
                        <Image
                          src="/log-out.svg"
                          alt="Profile"
                          width={20}
                          height={20}
                        />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {/* Right - Mobile */}
            <div className="flex items-center gap-3 md:hidden">
              <Search className="h-5 w-5" />
              {!isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-label={open ? "Close menu" : "Open menu"}
                  aria-expanded={open}
                >
                  {open ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Open profile menu"
                      className="flex items-center gap-2"
                    >
                      <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-200">
                        <Image
                          src={avatarSrc}
                          alt={displayName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-3"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={onLogout}
                      className="flex cursor-pointer items-center gap-2 px-4 py-3"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Jangan tampilkan di /write-post */}
      {!isWritePostPage && !isLoggedIn && open && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          {/* Overlay Header */}
          <div className="flex h-20 items-center justify-between border-b border-[#D5D7DA] px-4">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="flex items-center gap-2"
            >
              <Image
                src="/blog-logo.svg"
                alt="Logo"
                width={158}
                height={36}
                className="h-9 w-39.5"
                priority
              />
            </Link>
            <button
              type="button"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Overlay Content */}
          <div className="flex flex-col items-center gap-4 pt-9.75 px-20 text-center">
            <Link
              href="/login"
              className="font-semibold text-(--blue-alt) underline"
              onClick={closeMobileMenu}
            >
              Login
            </Link>

            <Link
              href="/register"
              className="inline-flex h-11 w-53.5 items-center justify-center rounded-full bg-(--blue-alt) text-sm font-semibold text-white"
              onClick={closeMobileMenu}
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
