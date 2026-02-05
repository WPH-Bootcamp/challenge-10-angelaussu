/**
 * Blog Types
 *
 * TODO: Define types sesuai dengan response dari API
 * Contoh structure (sesuaikan dengan API response yang sebenarnya):
 */

export type Post = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  imageUrl: string;
  author: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  likes: number;
  comments: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
};
