import { api } from "@/lib/axios";
import { Post, PaginatedResponse } from "@/types/blog";

// Recommended
export const getRecommendedPosts = async (page = 1) => {
  const res = await api.get<PaginatedResponse<Post>>("/posts/recommended", {
    params: { page },
  });
  return res.data;
};

// Most Liked
export const getMostLikedPosts = async (page = 1) => {
  const res = await api.get<PaginatedResponse<Post>>("/posts/most-liked", {
    params: { page },
  });
  return res.data;
};

export const getPostById = async (id: string | number) => {
  const res = await api.get<Post>(`/posts/${id}`);
  return res.data;
};
