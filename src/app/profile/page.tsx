"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/axios";

import { useRouter } from "next/navigation";
import { makePostSlug } from "@/lib/slug";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ADD: shadcn tabs (untuk Like/Comment tab di popup)
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ADD: types untuk statistik
type LikeUser = {
  id: number;
  name: string;
  headline: string;
  avatarUrl: string | null;
};

type CommentItem = {
  id: number;
  content: string;
  createdAt: string;
  author: LikeUser;
};

type ProfileResponse = {
  id: number;
  name: string;
  headline: string;
  avatarUrl: string | null;
  email: string;
};

type Author = {
  id: number;
  name: string;
  email: string;
};

type Post = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  imageUrl: string;
  author: Author;
  createdAt: string;
  likes: number;
  comments: number;
};

type MyPostsResponse = {
  data: Post[];
  total: number;
  page: number;
  lastPage: number;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ProfilePage() {
  const router = useRouter();

  const [tab, setTab] = useState<"posts" | "password">("posts");

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, lastPage: 1 });
  const [error, setError] = useState<string | null>(null);

  // ===== Profile =====
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  // version untuk cache-busting avatar (supaya selalu reload gambar terbaru)
  const [avatarVer, setAvatarVer] = useState<number>(0);

  // src avatar yang stabil + fallback
  const [avatarSrc, setAvatarSrc] = useState<string>("/author.png");

  const fetchProfile = useCallback(async () => {
    try {
      // sesuai swagger
      const res = await api.get<ProfileResponse>("/users/me");
      setProfile(res.data);
      // set avatar src
      const raw = res.data?.avatarUrl?.trim();
      setAvatarSrc(raw ? `${raw}?v=${Date.now()}` : "/author.png");
    } catch (e: any) {
      // biar tidak crash, cukup fallback
      setAvatarSrc("/author.png");
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // update avatarSrc kalau avatarUrl berubah atau ver berubah
  useEffect(() => {
    const raw = profile?.avatarUrl?.trim();
    const next = raw ? `${raw}?v=${avatarVer || 0}` : "/author.png";
    setAvatarSrc(next);
  }, [profile?.avatarUrl, avatarVer]);

  const displayedName = profile?.name || "John Doe";
  const displayedHeadline = profile?.headline || "Frontend Developer";

  // ===== Edit Profile Modal =====
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHeadline, setEditHeadline] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(
    null,
  );
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  function openEditModal() {
    setEditError(null);
    setEditSuccess(null);

    setEditName(profile?.name || "John Doe");
    setEditHeadline(profile?.headline || "Frontend Developer");

    setEditAvatarFile(null);
    if (editAvatarPreview) URL.revokeObjectURL(editAvatarPreview);
    setEditAvatarPreview(null);

    setEditOpen(true);
  }

  function handlePickAvatar(file: File | null) {
    setEditError(null);
    setEditSuccess(null);

    if (!file) {
      setEditAvatarFile(null);
      if (editAvatarPreview) URL.revokeObjectURL(editAvatarPreview);
      setEditAvatarPreview(null);
      return;
    }

    const max = 5 * 1024 * 1024;
    if (file.size > max) {
      setEditError("Image size must be 5MB or less.");
      setEditAvatarFile(null);
      if (editAvatarPreview) URL.revokeObjectURL(editAvatarPreview);
      setEditAvatarPreview(null);
      return;
    }

    setEditAvatarFile(file);

    if (editAvatarPreview) URL.revokeObjectURL(editAvatarPreview);
    setEditAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);

    setEditBusy(true);
    try {
      const fd = new FormData();
      if (editName.trim()) fd.append("name", editName.trim());
      if (editHeadline.trim()) fd.append("headline", editHeadline.trim());

      if (editAvatarFile) fd.append("avatar", editAvatarFile);

      const res = await api.patch<ProfileResponse>("/users/profile", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updated = res.data;

      setProfile(updated);

      setAvatarVer(Date.now());

      setEditSuccess("Profile updated successfully.");

      // tutup modal setelah sukses
      setEditOpen(false);

      // cleanup preview
      if (editAvatarPreview) URL.revokeObjectURL(editAvatarPreview);
      setEditAvatarPreview(null);
      setEditAvatarFile(null);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to update profile.";
      setEditError(String(msg));
    } finally {
      setEditBusy(false);
    }
  }

  // ===== Delete modal =====
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busyDeleteId, setBusyDeleteId] = useState<number | null>(null);

  function openDeleteModal(post: Post) {
    setDeleteError(null);
    setDeleteTarget(post);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    setDeleteOpen(false);
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function handleDelete(postId: number) {
    setBusyDeleteId(postId);
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setMeta((m) => ({ ...m, total: Math.max(0, m.total - 1) }));
      closeDeleteModal();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to delete post.";
      setDeleteError(String(msg));
    } finally {
      setBusyDeleteId(null);
    }
  }

  // ===== Posts =====
  const fetchMyPosts = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<MyPostsResponse>("/posts/my-posts", {
        params: { page },
      });
      setPosts(res.data.data);
      setMeta({
        total: res.data.total,
        page: res.data.page,
        lastPage: res.data.lastPage,
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to fetch your posts.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPosts(1);
  }, [fetchMyPosts]);

  // ===== Change Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passBusy, setPassBusy] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("New Password and Confirm New Password do not match.");
      return;
    }

    setPassBusy(true);
    try {
      const res = await api.patch("/users/password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res?.data?.success === true) {
        setPassSuccess(res?.data?.message || "Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
      } else {
        setPassError(res?.data?.message || "Failed to update password.");
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to update password.";
      setPassError(String(msg));
    } finally {
      setPassBusy(false);
    }
  }

  // ADD: Statistic modal state + fetch
  const [statOpen, setStatOpen] = useState(false);
  const [statTab, setStatTab] = useState<"likes" | "comments">("likes");
  const [statPost, setStatPost] = useState<Post | null>(null);

  const [statLoading, setStatLoading] = useState(false);
  const [statError, setStatError] = useState<string | null>(null);

  const [statLikes, setStatLikes] = useState<LikeUser[]>([]);
  const [statComments, setStatComments] = useState<CommentItem[]>([]);

  const fetchStats = useCallback(async (postId: number) => {
    setStatLoading(true);
    setStatError(null);

    try {
      const [likesRes, commentsRes] = await Promise.all([
        api.get<LikeUser[]>(`/posts/${postId}/likes`),
        api.get<CommentItem[]>(`/posts/${postId}/comments`),
      ]);

      setStatLikes(Array.isArray(likesRes.data) ? likesRes.data : []);
      setStatComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to fetch statistic.";
      setStatError(String(msg));
    } finally {
      setStatLoading(false);
    }
  }, []);

  function openStatModal(post: Post) {
    setStatPost(post);
    setStatTab("likes");
    setStatLikes([]);
    setStatComments([]);
    setStatError(null);
    setStatOpen(true);
    fetchStats(post.id);
  }

  function closeStatModal() {
    setStatOpen(false);
    setStatPost(null);
    setStatError(null);
    setStatLikes([]);
    setStatComments([]);
  }

  return (
    <main className="max-w-200 mx-auto lg:pt-12 md:pt-8 pt-4 pl-4 pr-4 min-h-screen">
      {/* Profile card */}
      <div className="rounded-[13px] border border-slate-200 bg-white md:px-6 md:py-4 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="md:h-20 md:w-20 h-12.5 w-12.5 relative">
            <Image
              src={avatarSrc}
              alt="avatar"
              fill
              className="object-cover rounded-full"
              onError={() => setAvatarSrc("/author.png")}
              priority
              unoptimized
            />
          </div>

          <div>
            <div className="md:text-lg text-sm font-bold text-(--black-alt)">
              {displayedName}
            </div>
            <div className="md:text-base text-sm text-(--black-alt)">
              {displayedHeadline}
            </div>
          </div>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="md:text-sm text-xs text-(--blue-alt) hover:underline font-semibold underline cursor-pointer"
              onClick={openEditModal}
            >
              Edit Profile
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-130">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>

            {editError && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {editError}
              </div>
            )}
            {editSuccess && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="flex items-center justify-center">
                <div className="relative h-20 w-20 rounded-full bg-slate-100">
                  <Image
                    src={editAvatarPreview || avatarSrc}
                    alt="profile preview"
                    fill
                    className="object-cover rounded-full"
                    unoptimized
                  />

                  <label
                    htmlFor="avatar"
                    className="absolute bottom-0 right-0 h-6 w-6 flex items-center justify-center cursor-pointer rounded-full"
                    title="Change avatar"
                  >
                    <Image
                      src="/photo.svg"
                      alt="upload"
                      width={80}
                      height={80}
                      className="rounded-full"
                    />
                  </label>

                  <input
                    id="avatar"
                    name="avatar"
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) =>
                      handlePickAvatar(e.target.files?.[0] ?? null)
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-(--black-alt) mb-2">
                  Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-(--black-alt) mb-2">
                  Profile Headline
                </label>
                <input
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  placeholder="Frontend Developer"
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-300"
                />
              </div>

              <button
                type="submit"
                disabled={editBusy}
                className="w-full h-12 rounded-full bg-(--blue-alt) text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {editBusy ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-slate-200 flex gap-6 max-[455px]:">
        <button
          className={[
            "py-2 text-sm px-14.5 font-semibold cursor-pointer",
            tab === "posts"
              ? "text-(--blue-alt) border-b-3 border-(--blue-alt)"
              : "text(--black-alt-300) hover:text-slate-900",
          ].join(" ")}
          onClick={() => setTab("posts")}
          type="button"
        >
          Your Post
        </button>

        <button
          className={[
            "py-2 md:px-14.5 px-2 text-sm cursor-pointer",
            tab === "password"
              ? "text-(--blue-alt) border-b-3 border-(--blue-alt)"
              : "text(--black-alt-300) hover:text-slate-900",
          ].join(" ")}
          onClick={() => setTab("password")}
          type="button"
        >
          Change Password
        </button>
      </div>

      {tab === "password" ? (
        <div className="mt-4 max-w-134.5">
          {passError && (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {passError}
            </div>
          )}
          {passSuccess && (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {passSuccess}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-(--black-alt) mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm outline-none focus:border-sky-300"
                />
                <span
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer select-none opacity-80 hover:opacity-100 transition"
                >
                  <Image
                    src={showCurrent ? "/hide.png" : "/eye.svg"}
                    alt="toggle password"
                    width={22}
                    height={22}
                  />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-(--black-alt) mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm outline-none focus:border-sky-300"
                />
                <span
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer select-none opacity-80 hover:opacity-100 transition"
                >
                  <Image
                    src={showNew ? "/hide.png" : "/eye.svg"}
                    alt="toggle password"
                    width={22}
                    height={22}
                  />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-(--black-alt) mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter confirm new password"
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm outline-none focus:border-sky-300"
                />
                <span
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer select-none opacity-80 hover:opacity-100 transition"
                >
                  <Image
                    src={showConfirm ? "/hide.png" : "/eye.svg"}
                    alt="toggle password"
                    width={22}
                    height={22}
                  />
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={passBusy}
              className="w-full h-12 rounded-full bg-(--blue-alt) text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed mt-2 cursor-pointer"
            >
              {passBusy ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="mt-5 flex items-center justify-between pb-5 flex-col-reverse md:flex-row">
            <div className="md:text-2xl text-lg font-bold text-(--black-alt) md:pt-0 pt-4 w-full">
              {loading ? "Loading..." : `${meta.total} Post`}
            </div>

            <Link
              href="/write-post"
              className="inline-flex items-center gap-2 rounded-full bg-(--blue-alt) text-white px-4 py-2 text-sm font-medium hover:bg-sky-700 h-11 w-full text-center justify-center md:w-45.5 md:text-left md:justify-start"
            >
              <span>
                <img src="edit-post.svg" />
              </span>
              Write Post
            </Link>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-4 boder-(--gray-alt) border-t pt-5">
            {!loading && !error && posts.length === 0 && (
              <div className=" text-sm text-center text-slate-600">
                <h3>Your writing journey starts here</h3>
                <p>
                  No posts yet, but every great writer starts with the first
                  one.
                </p>
              </div>
            )}

            {posts.map((p) => {
              const excerpt = stripHtml(p.content).slice(0, 110);
              const postHref = `/posts/${makePostSlug(p.id, p.title)}`;
              const editHref = `/posts/${makePostSlug(p.id, p.title)}/edit`;

              return (
                <div
                  key={p.id}
                  className="bg-white flex gap-6 cursor-pointer border-b border-(--gray-alt) md:pb-5 md:mb-5 pb-4 mb-4"
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(postHref)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(postHref);
                    }
                  }}
                >
                  <div className="relative h-64.5 w-85 shrink-0 overflow-hidden hidden md:block">
                    <Image
                      src={p.imageUrl}
                      alt={p.title}
                      fill
                      className="object-cover rounded-lg "
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-(--black-alt)">
                      {p.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.tags?.map((t) => (
                        <span
                          key={`${p.id}-${t}`}
                          className="text-[12px] px-2 py-0.5 rounded-[8px] border border-(--gray-alt) text-(--black-alt) bg-white"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 text-xm text-(--black-alt) line-clamp-2 leading-7">
                      {excerpt || "—"}
                      {excerpt ? "..." : ""}
                    </div>

                    <div className="mt-2 text-[12px] text-(--gray-alt-500) flex flex-wrap gap-x-4 gap-y-1">
                      <span>Created {formatDateTime(p.createdAt)}</span>
                    </div>

                    <div className="mt-2 flex items-center gap-4">
                      {/* UPDATED: Statistic membuka popup */}
                      <button
                        type="button"
                        className="text-(--blue-alt) underline text-sm font-semibold cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          openStatModal(p);
                        }}
                      >
                        Statistic
                      </button>

                      <Link
                        href={editHref}
                        className="text-(--blue-alt) underline text-sm font-semibold cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(p);
                        }}
                        disabled={busyDeleteId === p.id}
                        className="text-(--red-alt) underline text-[14px] font-semibold cursor-pointer disabled:opacity-60"
                      >
                        {busyDeleteId === p.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && meta.lastPage > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                className="text-sm px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                disabled={meta.page <= 1}
                onClick={() => fetchMyPosts(meta.page - 1)}
              >
                Prev
              </button>
              <div className="text-sm text-slate-600">
                Page {meta.page} / {meta.lastPage}
              </div>
              <button
                type="button"
                className="text-sm px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                disabled={meta.page >= meta.lastPage}
                onClick={() => fetchMyPosts(meta.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle className="text-left">Delete</DialogTitle>
          </DialogHeader>

          <div className="text-sm text-slate-600">
            Are you sure you want to delete?
          </div>

          {deleteError && (
            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {deleteError}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
              disabled={busyDeleteId === deleteTarget?.id}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => deleteTarget?.id && handleDelete(deleteTarget.id)}
              disabled={!deleteTarget || busyDeleteId === deleteTarget?.id}
              className="h-10 px-6 rounded-full bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {busyDeleteId === deleteTarget?.id ? "Deleting..." : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD: Statistic Popup */}
      <Dialog
        open={statOpen}
        onOpenChange={(v) => {
          if (v) setStatOpen(true);
          else closeStatModal();
        }}
      >
        <DialogContent className="sm:max-w-180 md:p-6 px-4 py-6">
          <DialogHeader>
            <DialogTitle className="text-left">Statistic</DialogTitle>
          </DialogHeader>

          <Tabs
            value={statTab}
            onValueChange={(v) => setStatTab(v as "likes" | "comments")}
            className="w-full"
          >
            <TabsList
              className="
    relative
    w-full
    h-12
    grid grid-cols-2
    p-0
    m-0
    rounded-none
    bg-transparent
    border-b border-slate-200
  "
            >
              {/* LIKE */}
              <TabsTrigger
                value="likes"
                className="
      group relative
      w-full h-full
      p-0 m-0
      rounded-none
      bg-transparent
      border-0
      shadow-none!
      cursor-pointer
      flex items-center justify-center gap-2
      text-(--black-alt) text-[15px] font-medium
      data-[state=active]:text-(--blue-alt)

      focus:outline-none
      focus-visible:outline-none
      focus-visible:ring-0
      focus-visible:ring-offset-0
    "
              >
                <Image
                  src="/like-normal.svg"
                  alt="like"
                  width={18}
                  height={18}
                  className="group-data-[state=active]:hidden"
                />
                <Image
                  src="/like-statistic.svg"
                  alt="like active"
                  width={18}
                  height={18}
                  className="hidden group-data-[state=active]:block"
                />
                Like
                {/* underline */}
                <span
                  className="
        absolute left-0 bottom-0
        w-full h-0.75
        bg-(--blue-alt)
        opacity-0
        group-data-[state=active]:opacity-100
      "
                />
              </TabsTrigger>

              {/* COMMENT */}
              <TabsTrigger
                value="comments"
                className="
      group relative
      w-full h-full
      p-0 m-0
      rounded-none
      bg-transparent
      border-0
      shadow-none!
      cursor-pointer

      flex items-center justify-center gap-2
      text-(--black-alt) text-[15px] font-medium
      data-[state=active]:text-(--blue-alt)

      focus:outline-none
      focus-visible:outline-none
      focus-visible:ring-0
      focus-visible:ring-offset-0
    "
              >
                <Image
                  src="/comment-normal.svg"
                  alt="comment"
                  width={18}
                  height={18}
                  className="group-data-[state=active]:hidden"
                />
                <Image
                  src="/comment-active.svg"
                  alt="comment active"
                  width={18}
                  height={18}
                  className="hidden group-data-[state=active]:block"
                />
                Comment
                {/* underline */}
                <span
                  className="
        absolute left-0 bottom-0
        w-full h-0.75
        bg-(--blue-alt)
        opacity-0
        group-data-[state=active]:opacity-100
      "
                />
              </TabsTrigger>
            </TabsList>

            {statError && (
              <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {statError}
              </div>
            )}

            {statLoading ? (
              <div className="mt-6 text-sm text-slate-600">Loading...</div>
            ) : (
              <>
                <TabsContent value="likes" className="mt-4">
                  <div className="text-sm font-semibold text-slate-800 mb-3">
                    Like ({statLikes.length})
                  </div>

                  {statLikes.length === 0 ? (
                    <div className="text-sm text-slate-600">No likes yet.</div>
                  ) : (
                    <div className="divide-y rounded-md border border-slate-200">
                      {statLikes.map((u) => {
                        const avatar =
                          u.avatarUrl && u.avatarUrl.trim().length > 0
                            ? u.avatarUrl
                            : "/author.png";

                        return (
                          <div
                            key={u.id}
                            className="flex items-center gap-3 p-3"
                          >
                            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                              <Image
                                src={avatar}
                                alt={u.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate">
                                {u.name}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {u.headline || "Frontend Developer"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="comments" className="mt-4">
                  <div className="text-sm font-semibold text-slate-800 mb-3">
                    Comment ({statComments.length})
                  </div>

                  {statComments.length === 0 ? (
                    <div className="text-sm text-slate-600">
                      No comments yet.
                    </div>
                  ) : (
                    <div className="divide-y ">
                      {statComments.map((c) => {
                        const a = c.author;
                        const avatar =
                          a?.avatarUrl && a.avatarUrl.trim().length > 0
                            ? a.avatarUrl
                            : "/author.png";

                        return (
                          <div key={c.id} className="flex gap-3 py-3">
                            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                              <Image
                                src={avatar}
                                alt={a?.name || "User"}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="">
                                <div className="text-sm font-semibold text-slate-900 truncate">
                                  {a?.name || "Anonymous"}
                                </div>
                                <div className="text-xs text-slate-500 shrink-0">
                                  {c.createdAt
                                    ? formatDateTime(c.createdAt)
                                    : ""}
                                </div>
                              </div>

                              <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap break-words">
                                {c.content}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>

          {/* (optional) */}
          {statPost ? null : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
