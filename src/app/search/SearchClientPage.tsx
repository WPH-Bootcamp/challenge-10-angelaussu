"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/axios";
import PostCardSkeleton from "@/components/PostCardSkeleton";
import { makePostSlug } from "@/lib/slug";

type PostItem = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  imageUrl?: string;
  author: { id: number; name: string; email: string; avatarUrl?: string };
  createdAt: string;
  likes: number;
  comments: number;
};

type SearchResponse = {
  data: PostItem[];
  total: number;
  page: number;
  lastPage: number;
};

export default function SearchClientPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const query = (sp.get("query") || "").trim();
  const pageParam = Number(sp.get("page") || 1);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const limit = 10;

  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<SearchResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const found = (res?.data?.length || 0) > 0;

  const titleText = useMemo(() => {
    if (!query) return "Search";
    return `Result for “${query}”`;
  }, [query]);

  const goPage = (nextPage: number) => {
    router.push(`/search?query=${encodeURIComponent(query)}&page=${nextPage}`);
  };

  useEffect(() => {
    let active = true;

    async function run() {
      setErr(null);
      setRes(null);

      if (!query) return;

      try {
        setLoading(true);

        const r = await api.get<SearchResponse>("/posts/search", {
          params: { query, limit, page },
        });

        if (!active) return;
        setRes(r.data);
      } catch (e: any) {
        if (!active) return;
        setErr(
          e?.response?.data?.message ||
            e?.message ||
            "Gagal mengambil hasil search.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [query, page]);

  return (
    <main className="mx-auto max-w-300  lg:pr-12 md:mb-24 lg:mb-39 mb-0 px-4 md:px-6 lg:px-0 py-10">
      <h1 className="mb-4 text-[20px] md:mb-6 md:text-[28px] font-bold text-(--black-alt)">
        {titleText}
      </h1>

      {/* Skeleton  */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && err && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      )}

      {/* Empty query */}
      {!loading && !err && !query && (
        <div className="text-sm text-slate-500">
          Type a keyword in the search bar to start searching.
        </div>
      )}

      {/* Found */}
      {!loading && !err && query && found && res && (
        <div className="grid grid-cols-1">
          {res.data.map((post) => {
            const slug = makePostSlug(post.id, post.title);
            const cover = post.imageUrl || "/author.png";
            const excerpt = (post.content || "").slice(0, 160);

            return (
              <Link
                key={post.id}
                href={`/posts/${slug}`}
                className="group flex items-center gap-6 rounded-0 bg-white transition md:pb-8.25 md:mb-8.25 pb-4 mb-4 border-b border-(--gray-alt) last:pb-0 last:mb-0 last:border-b-0"
              >
                {/* Image kiri (hidden di mobile) */}
                <div className="relative h-64.5 w-85 overflow-hidden hidden md:block">
                  <Image
                    src={cover}
                    alt={post.title}
                    fill
                    className="h-64.5 w-85 rounded-[6px] transition group-hover:scale-105 object-cover"
                  />
                </div>

                {/* Content kanan */}
                <div className="w-full md:w-110.75 md:pr-5">
                  <h4 className="line-clamp-2 lg:text-xl md:text-lg text-base font-bold tracking-[-0.03em] leading-8.5 group-hover:text-(--blue-alt)">
                    {post.title}
                  </h4>

                  {!!post.tags?.length && (
                    <div className="mt-2 mb-2 md:mt-3 md:mb-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex h-7 items-center rounded-[8px] border border-(--gray-alt) bg-white px-2 py-0.5 text-[12px] text-(--black-alt)"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {!!excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm tracking-[-0.03em] leading-7 text-gray-600">
                      {excerpt}
                      {post.content.length > 160 ? "..." : ""}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-(--gray-alt-dark)">
                    <div className="flex items-center gap-2">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                        <Image
                          src={post.author?.avatarUrl || "/author.png"}
                          alt={post.author?.name || "Author"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="font-medium text-(--black-alt)">
                        {post.author?.name || "User"}
                      </span>
                    </div>

                    <span className="text-(--gray-alt-400)">&bull;</span>

                    <span className="text-sm text-(--gray-alt-300)">
                      {new Date(post.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Likes & Comments */}
                  <div className="flex items-center gap-5 text-xs mt-4">
                    <span className="flex items-center gap-1.5">
                      <img src="/thumb.svg" alt="Likes" /> {post.likes}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <img src="/comment.svg" alt="Comment" /> {post.comments}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Pagination */}
          <div className="mt-4 md:mt-8 flex flex-wrap items-center gap-2 justify-center ">
            <button
              type="button"
              onClick={() => goPage(res.page - 1)}
              disabled={res.page <= 1}
              className="rounded px-3 py-1 disabled:opacity-50 flex items-center gap-3.75 cursor-pointer text-xs md:text-sm"
            >
              <Image
                src="/arrow-prev.svg"
                alt="Arrow prev"
                width={6}
                height={12}
              />
              Prev
            </button>

            {Array.from({ length: res.lastPage }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => goPage(p)}
                  className={`rounded-full md:h-12 md:w-12 w-9 h-9 px-3 py-1 cursor-pointer text-xs md:text-sm ${
                    p === res.page
                      ? "bg-(--blue-alt) text-white"
                      : " hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => goPage(res.page + 1)}
              disabled={res.page >= res.lastPage}
              className="px-3 py-1 disabled:opacity-50 flex items-center gap-3.75 cursor-pointer text-xs md:text-sm"
            >
              Next
              <Image
                src="/arrow-next.svg"
                alt="Arrow next"
                width={6}
                height={12}
              />
            </button>
          </div>
        </div>
      )}

      {/* Not Found */}
      {!loading && !err && query && (!res || !found) && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Image
            src="/docs.svg"
            alt="Not Found"
            width={120}
            height={120}
            className="mb-4"
          />
          <div className="text-base font-semibold text-(--black-alt)">
            No results found
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Try using different keywords
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-(--blue-alt) px-6 text-sm font-semibold text-white hover:bg-(--blue-alt)/90"
          >
            Back to Home
          </Link>
        </div>
      )}
    </main>
  );
}
