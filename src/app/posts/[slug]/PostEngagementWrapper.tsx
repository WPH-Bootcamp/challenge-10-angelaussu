"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/axios";

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

export default function PostEngagementBar({
  postId,
  initialLikes,
  initialComments,
}: {
  postId: number;
  initialLikes: number;
  initialComments: number;
}) {
  const [me, setMe] = useState<MeProfile | null>(null);
  const isLoggedIn = !!me?.id;

  const [likes, setLikes] = useState<number>(initialLikes ?? 0);
  const [liked, setLiked] = useState(false); // used for icon switching
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // comment count state (fetch actual total)
  const [commentCount, setCommentCount] = useState<number>(
    initialComments ?? 0,
  );

  const endpoints = useMemo(() => {
    return {
      me: "/users/me",
      like: `/posts/${postId}/like`,
      comments: `/posts/${postId}/comments`,
      // optional: if you have endpoint to know liked status, add it here
      // likedStatus: `/posts/${postId}/liked`,
    };
  }, [postId]);

  function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  useEffect(() => {
    let mounted = true;

    async function checkMe() {
      try {
        const token = getToken();
        if (!token) {
          if (!mounted) return;
          setMe(null);
          return;
        }
        const res = await api.get(endpoints.me, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        setMe(res.data);
      } catch {
        if (!mounted) return;
        setMe(null);
      }
    }

    async function fetchCommentCount() {
      try {
        const token = getToken();
        const res = await api.get(endpoints.comments, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const list: CommentItem[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        if (!mounted) return;
        setCommentCount(list.length);
      } catch {
        if (!mounted) return;
        setCommentCount(initialComments ?? 0);
      }
    }

    checkMe();
    fetchCommentCount();

    return () => {
      mounted = false;
    };
  }, [endpoints, initialComments]);

  async function handleToggleLike() {
    setError(null);

    if (!isLoggedIn) {
      setError("Please log in to like this post.");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Please log in to like this post.");
      return;
    }

    setBusy(true);
    try {
      const res = await api.post(
        endpoints.like,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // expected: { likes, liked } OR { data: { likes, liked } }
      const nextLikes =
        res?.data?.likes ??
        res?.data?.data?.likes ??
        (liked ? Math.max(0, likes - 1) : likes + 1);
      const nextLiked = res?.data?.liked ?? res?.data?.data?.liked ?? !liked;

      setLikes(Number(nextLikes));
      setLiked(Boolean(nextLiked));
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to like this post.";
      setError(String(msg));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-4 mt-4 flex items-center gap-5 border-b border-(--gray-alt) pb-4 text-sm text-(--gray-alt-300)">
        <button
          type="button"
          onClick={handleToggleLike}
          disabled={busy}
          className="flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          {/* icon changes when liked */}
          <img
            src={liked ? "/liked-icon.svg" : "/thumb.svg"}
            alt="Likes"
          />{" "}
          {likes}
        </button>

        <span className="flex items-center gap-1.5">
          <img src="/comment.svg" alt="Comment" /> {commentCount}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}
    </>
  );
}
