/**
 * API Utility
 *
 * Helper functions untuk fetch data dari backend API
 *
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Generic fetch function dengan error handling
 */
async function fetchAPI<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Fetch Error:", error);
    throw error;
  }
}

// TODO: Implement API functions sesuai dengan endpoint yang tersedia
// Contoh:
// export async function getBlogPosts() {
//   return fetchAPI<BlogPost[]>('/posts');
// }
//
// export async function getBlogPost(id: string) {
//   return fetchAPI<BlogPost>(`/posts/${id}`);
// }

export { fetchAPI, API_BASE_URL };
