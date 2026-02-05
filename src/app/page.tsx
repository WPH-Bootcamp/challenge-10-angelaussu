import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import {
  getRecommendedPosts,
  getMostLikedPosts,
} from "@/services/post.service";
import RecommendedClient from "@/app/posts/recommended/RecommendedClient";
import MostLikedClient from "@/components/MostLikedClient";

/**
 * Home Page
 *
 * TODO: Implement homepage sesuai dengan design Figma
 * - Tampilkan daftar artikel blog
 * - Implement search/filter jika diperlukan
 * - Handle loading dan error states
 */

export default async function Home() {
  const queryClient = new QueryClient();

  // SSR Prefetch recommended posts halaman 1
  await queryClient.prefetchQuery({
    queryKey: ["posts", "recommended", 1],
    queryFn: () => getRecommendedPosts(1),
  });

  // SSR Prefetch most liked posts
  await queryClient.prefetchQuery({
    queryKey: ["posts", "most-liked"],
    queryFn: () => getMostLikedPosts(1),
  });

  return (
    <div className="min-h-screen">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <main className="container mx-auto max-w-300 px-4 md:px-6 lg:px-10 xl:px-0">
          {/* Layout 2 column: main + aside */}
          <section className="lg:mt-12 md:mt-10 mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
            {/* Main content */}
            <RecommendedClient />
            {/* Aside */}
            <aside className="space-y-4 lg:sticky lg:top-24 self-start mb-5 md:mb-0">
              <h3 className="md:text-2xl text-5 font-bold mb-5">Most Liked</h3>
              <MostLikedClient />
            </aside>
          </section>
        </main>
      </HydrationBoundary>
    </div>
  );
}
