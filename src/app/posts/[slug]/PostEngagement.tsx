"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/axios";

//shadcn dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MeProfile = {
  id: number;
  name: string;
  email: string;
  headline?: string;
  avatarUrl?: string | null;
};

type CommentItem = {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    avatarUrl?: string | null;
  };
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function PostComments({
  postId,
  initialComments,
}: {
  postId: number;
  initialComments: number;
}) {
  const [me, setMe] = useState<MeProfile | null>(null);
  const isLoggedIn = !!me?.id;

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [count, setCount] = useState<number>(initialComments ?? 0);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  //  modal state
  const [open, setOpen] = useState(false);

  const endpoints = useMemo(() => {
    return {
      me: "/users/me",
      comments: `/comments/${postId}`,
    };
  }, [postId]);

  function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  async function fetchComments() {
    try {
      setLoading(true);
      const token = getToken();
      const res = await api.get(endpoints.comments, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const list: CommentItem[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setComments(list);
      setCount(list.length);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function boot() {
      // check login
      try {
        const token = getToken();
        if (!token) {
          if (!mounted) return;
          setMe(null);
        } else {
          const res = await api.get(endpoints.me, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!mounted) return;
          setMe(res.data);
        }
      } catch {
        if (!mounted) return;
        setMe(null);
      }

      if (!mounted) return;
      await fetchComments();
    }

    boot();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoints]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isLoggedIn) {
      setError("Please log in to write a comment.");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Please log in to write a comment.");
      return;
    }

    if (!text.trim()) {
      setError("Comment cannot be empty.");
      return;
    }

    setBusy(true);
    try {
      const res = await api.post(
        endpoints.comments,
        { content: text.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // if backend returns created comment, prepend.
      const created: CommentItem | null = res?.data?.id
        ? res.data
        : res?.data?.data?.id
          ? res.data.data
          : null;

      if (created) {
        setComments((prev) => [created, ...prev]);
        setCount((c) => c + 1);
      } else {
        await fetchComments();
      }

      setText("");
      setSuccess("Comment posted successfully.");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to post comment.";
      setError(String(msg));
    } finally {
      setBusy(false);
    }
  }

  // preview 3 comments only
  const preview = comments.slice(0, 3);
  const hasMore = comments.length > 3;

  // reusable list UI
  const CommentList = ({ list }: { list: CommentItem[] }) => {
    if (loading) {
      return (
        <div className="py-6 text-sm text-(--gray-alt-300)">
          Loading comments...
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <div className="py-6 text-sm text-(--gray-alt-300)">
          No comments yet.
        </div>
      );
    }
    return (
      <div className="divide-y divide-(--gray-alt)">
        {list.map((c) => (
          <div key={c.id} className="py-5">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                <Image
                  src={c.author?.avatarUrl || "/author.png"}
                  alt={c.author?.name || "Author"}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-(--black-alt)">
                  {c.author?.name || "Anonymous"}
                </div>
                <div className="text-xs text-(--gray-alt-300) mt-1">
                  {formatDate(c.createdAt)}
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm text-(--black-alt-300) leading-6">
              {c.content}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-(--black-alt) mb-6">
        Comments({count})
      </h3>

      {/* Form (on page) */}
      {isLoggedIn ? (
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-200">
              <Image
                src={me?.avatarUrl || "/author.png"}
                alt={me?.name || "User"}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-sm font-medium text-(--black-alt)">
              {me?.name}
            </span>
          </div>

          <p className="mt-3 text-sm text-(--black-alt) font-semibold">
            Give your Comments
          </p>

          {error && (
            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={submit} className="mt-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your comment"
              className="w-full min-h-30 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
            />
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="h-11 w-40 rounded-full bg-(--blue-alt) text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {busy ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-8 text-sm text-(--gray-alt-300)">
          Please log in to write a comment.
        </div>
      )}

      {/* Preview list (3 only) */}
      <div className="border-t border-(--gray-alt)">
        <CommentList list={preview} />

        {/* See All Comments opens modal */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 text-sm text-(--blue-alt) underline cursor-pointer font-semibold"
          >
            See All Comments
          </button>
        )}
      </div>

      {/* Modal (shadcn) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-160 p-0 overflow-hidden">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Comments({count})
              </DialogTitle>
            </DialogHeader>

            {/* form inside modal (same like screenshot) */}
            {isLoggedIn ? (
              <div className="mt-4">
                <p className="text-sm text-(--black-alt) font-medium">
                  Give your Comments
                </p>

                <form onSubmit={submit} className="mt-3">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter your comment"
                    className="w-full min-h-27.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={busy}
                      className="h-11 w-40 rounded-full bg-(--blue-alt) text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {busy ? "Sending..." : "Send"}
                    </button>
                  </div>
                </form>

                {error && (
                  <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {success}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 text-sm text-(--gray-alt-300)">
                Please log in to write a comment.
              </div>
            )}

            {/* full list in modal */}
            <div className="mt-5 border-t border-(--gray-alt) pt-3 max-h-[55vh] overflow-y-auto pr-1">
              <CommentList list={comments} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
