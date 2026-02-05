"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRecommendedPosts } from "@/services/post.service";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import PostCardSkeleton from "@/components/PostCardSkeleton";
import { makePostSlug } from "@/lib/slug";

export default function RecommendedClient() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["posts", "recommended", page],
    queryFn: () => getRecommendedPosts(page),
    staleTime: 1000 * 60, // cache 1 menit
  });

  // Prefetch next page
  useEffect(() => {
    if (data && data.page < data.lastPage) {
      queryClient.prefetchQuery({
        queryKey: ["posts", "recommended", page + 1],
        queryFn: () => getRecommendedPosts(page + 1),
      });
    }
  }, [data, page, queryClient]);

  return (
    <div className="mx-auto max-w-201.75 lg:border-r lg:border-(--gray-alt) lg:pr-12 md:mb-24 lg:mb-39 mb-0">
      <h1 className="mb-4 text-[20px] md:mb-6 md:text-[28px] font-bold">
        Recommend For You
      </h1>

      {/* Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Data */}
      <div className="grid grid-cols-1">
        {data?.data.slice(0, 5).map((post) => (
          <Link
            key={post.id}
            href={`/posts/${makePostSlug(post.id, post.title)}`}
            className="group flex items-center gap-6 rounded-0 bg-white transition md:pb-8.25 md:mb-8.25 pb-4 mb-4 border-b border-(--gray-alt) last:pb-0 last:mb-0 last:border-b-0"
          >
            <div className="relative h-64.5 w-85 overflow-hidden hidden md:block">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="h-64.5 w-85 rounded-[6px] transition group-hover:scale-105"
              />
            </div>

            <div className="w-110.75 pr-5">
              <h4 className="line-clamp-2 lg:text-xl md:text-lg text-base font-bold tracking-[-0.03em] leading-8.5 group-hover:text-(--blue-alt)">
                {post.title}
              </h4>

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

              <p className="mt-2 line-clamp-2 text-sm tracking-[-0.03em] leading-7 text-gray-600">
                {post.content}
              </p>

              {/* Meta info */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-(--gray-alt-dark)">
                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                    {/* Profile Author */}
                    <Image
                      src={post.author.avatarUrl || "/author.png"}
                      alt={post.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="font-medium text-(--black-alt)">
                    {post.author.name}
                  </span>
                </div>
                <span className="text-(--gray-alt-400)">&bull;</span>
                {/* Date */}
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
                  {" "}
                  <img src="/comment.svg" alt="Comment" /> {post.comments}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {data && (
        <div className="mt-4 md:mt-8 flex flex-wrap items-center gap-2 justify-center border-t border-(--gray-alt)  pt-4">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="rounded px-3 py-1 disabled:opacity-50 flex items-center gap-3.75 cursor-pointer text-xs md:text-sm"
          >
            <Image src="/arrow-prev.svg" alt="Prev" width={6} height={12} />
            Prev
          </button>

          {Array.from({ length: data.lastPage }).map((_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`rounded-full md:h-12 md:w-12 w-9 h-9 px-3 py-1 cursor-pointer text-xs md:text-sm ${
                  p === page
                    ? "bg-(--blue-alt) text-white"
                    : " hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === data.lastPage}
            className=" px-3 py-1 disabled:opacity-50 flex items-center gap-3.75 cursor-pointer text-xs md:text-sm"
          >
            Next
            <Image
              src="/arrow-next.svg"
              alt="Arrow next"
              width={6}
              height={12}
              style={{ height: "auto" }}
            />
          </button>

          {isFetching && <span className="ml-2 text-sm">Updating...</span>}
        </div>
      )}
    </div>
  );
}
