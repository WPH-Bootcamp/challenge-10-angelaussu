import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPostById, getRecommendedPosts } from "@/services/post.service";
import { extractIdFromPostSlug, makePostSlug } from "@/lib/slug";

// ADD (two client components)
import PostEngagementBar from "./PostEngagementWrapper";
import PostComments from "./PostEngagement";

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const id = extractIdFromPostSlug(slug);

  if (!id) {
    return {
      title: "Post not found - Blog App",
    };
  }

  try {
    const post = await getPostById(id);

    if (!post) {
      return {
        title: "Post not found - Blog App",
      };
    }

    return {
      title: `${post.title} - Blog App`,
      description: post.content?.slice(0, 150),
      openGraph: {
        title: `${post.title} - Blog App`,
        description: post.content?.slice(0, 150),
        images: [
          {
            url: post.imageUrl,
          },
        ],
      },
    };
  } catch {
    return {
      title: "Post not found - Blog App",
    };
  }
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const id = extractIdFromPostSlug(slug);
  if (!id) notFound();

  let post;
  try {
    post = await getPostById(id);
  } catch {
    notFound();
  }

  if (!post) notFound();

  // ============================
  // Other Post (1 item)
  // ============================
  const recommended = await getRecommendedPosts(1);
  const otherPost = recommended.data.find((p) => p.id !== post.id);

  return (
    <section className="mx-auto max-w-3xl lg:pt-12 md:pt-8 pt-6 pb-55.75 px-4 md:px-6 lg:px-10 xl:px-0">
      {/* ============================
          MAIN POST
      ============================ */}
      <article className="prose">
        <h1 className="lg:text-4xl md:text-3xl text-2xl font-bold tracking-[-0.02em] md:leading-11 leading-9.5">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags?.map((tag: string) => (
            <span key={tag} className="rounded-[8px] border px-2 py-1 text-xs">
              {tag}
            </span>
          ))}
        </div>

        {/* Author row */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-b border-(--gray-alt) pb-4 text-sm text-(--gray-alt-dark)">
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200">
              <Image
                src={post.author.avatarUrl || "/author.png"}
                alt={post.author.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <span className="font-medium text-(--black-alt)">
              {post.author.name}
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

        {/* Like + total comment row UNDER profile */}
        <PostEngagementBar
          postId={post.id}
          initialLikes={post.likes}
          initialComments={post.comments}
        />

        {/* Image */}
        <div className="relative mt-6 lg:h-90 md:h-80 h-50.75 w-full overflow-hidden rounded-lg">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        {/* Content */}
        <div className="mt-4 tracking-[-0.03em] leading-7.5 text-(--black-alt-300) ">
          <p>{post.content}</p>
        </div>
      </article>

      {/* Comment form + list AFTER content, BEFORE other post */}
      <div className="mt-12 border-t border-b border-(--gray-alt) pt-4 md:pb-4 pb-3">
        <PostComments postId={post.id} initialComments={post.comments} />
      </div>

      {/* ============================
          OTHER POST
      ============================ */}
      {otherPost && (
        <div className="mt-20">
          <h2 className="mb-6 text-[28px] font-bold">Other Post</h2>
          <Link
            href={`/posts/${makePostSlug(otherPost.id, otherPost.title)}`}
            className="group flex items-center gap-6 rounded-0 bg-white"
          >
            {/* Image */}
            <div className="relative h-64.5 w-85 overflow-hidden hidden md:block">
              <Image
                src={otherPost.imageUrl}
                alt={otherPost.title}
                fill
                className=" h-64.5 w-85 rounded-[6px] transition group-hover:scale-105"
                sizes="340px"
              />
            </div>

            {/* Content */}
            <div className="w-110.75 pr-5">
              <h4 className="line-clamp-2 text-xl font-bold tracking-[-0.03em] leading-8.5 group-hover:text-(--blue-alt)">
                {otherPost.title}
              </h4>

              <div className="mb-3 mt-3 flex flex-wrap gap-2">
                {otherPost.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="flex h-7 items-center rounded-[8px] border border-(--gray-alt) bg-white px-2 py-0.5 text-[12px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-2 line-clamp-2 text-sm tracking-[-0.03em] leading-7 text-gray-600">
                {otherPost.content}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-(--gray-alt-dark)">
                <div className="flex items-center gap-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                    <Image
                      src={otherPost.author.avatarUrl || "/author.png"}
                      alt={otherPost.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="font-medium text-(--black-alt)">
                    {otherPost.author.name}
                  </span>
                </div>

                <span className="text-(--gray-alt-400)">&bull;</span>

                <span className="text-sm text-(--gray-alt-300)">
                  {new Date(otherPost.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-5 text-xs mt-4">
                <span className="flex items-center gap-1.5">
                  <img src="/thumb.svg" alt="Likes" /> {otherPost.likes}
                </span>
                <span className="flex items-center gap-1.5">
                  <img src="/comment.svg" alt="Comment" /> {otherPost.comments}
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}
    </section>
  );
}
