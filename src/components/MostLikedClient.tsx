"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { getMostLikedPosts } from "@/services/post.service";
import PostCardSkeleton from "@/components/PostCardSkeleton";

export default function MostLikedClient() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["posts", "most-liked"],
    queryFn: () => getMostLikedPosts(1),
    staleTime: 1000 * 60,
  });

  if (isError) {
    return <p className="text-red-500">Failed to load most liked posts.</p>;
  }

  return (
    <div className="grid grid-cols-1 ">
      {isLoading &&
        Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}

      {data?.data.slice(0, 3).map((post) => (
        <Link
          key={post.id}
          href={`/posts/${post.id}`}
          className="
      pb-5 mb-5 border-b border-(--gray-alt)
      last:pb-0 last:mb-0 last:border-b-0
    "
        >
          <div>
            <h3 className="line-clamp-2 font-semibold text-base">
              {post.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-(--black-alt) leading-7">
              {post.content}
            </p>

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
      ))}
    </div>
  );
}
