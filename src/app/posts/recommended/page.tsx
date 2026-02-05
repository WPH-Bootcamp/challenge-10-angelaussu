import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { getRecommendedPosts } from "@/services/post.service";
import RecommendedClient from "./RecommendedClient";

export default async function Page() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["posts", "recommended", 1],
    queryFn: () => getRecommendedPosts(1),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecommendedClient />
    </HydrationBoundary>
  );
}
