"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TiptapEditor from "@/components/TiptapEditor";
import { api } from "@/lib/axios";

type PostDetailResponse = {
  id: number;
  title: string;
  content: string; // HTML
  tags: string[];
  imageUrl: string; // cover url (cloudinary / etc)
};

function parseTags(input: string) {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function parsePostIdFromSlug(slug: string) {
  const idStr = slug.split("-")[0];
  const id = Number(idStr);
  return Number.isFinite(id) ? id : null;
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const postId = useMemo(
    () => (slug ? parsePostIdFromSlug(slug) : null),
    [slug],
  );

  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState(""); // HTML dari tiptap
  const [tagsText, setTagsText] = useState("");
  const tags = useMemo(() => parseTags(tagsText), [tagsText]);

  // image baru (opsional saat edit)
  const [image, setImage] = useState<File | null>(null);

  // cover lama dari server
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");

  // preview untuk image baru
  const imagePreview = useMemo(
    () => (image ? URL.createObjectURL(image) : ""),
    [image],
  );

  // cleanup objectURL biar tidak memory leak
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const [loadingPage, setLoadingPage] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setError(null);
    setOk(null);
    setLoadingPage(true);

    try {
      const res = await api.get<PostDetailResponse>(`/posts/${postId}`);
      const p = res.data;

      setTitle(p.title ?? "");
      setContentHtml(p.content ?? "");
      setTagsText((p.tags ?? []).join(", "));
      setExistingImageUrl(p.imageUrl ?? "");
      setImage(null);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Gagal load post.";
      setError(String(msg));
    } finally {
      setLoadingPage(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  async function handleSubmit() {
    setError(null);
    setOk(null);

    if (!postId) return setError("Invalid post id.");

    if (!title.trim()) return setError("Title wajib diisi.");

    const plain = contentHtml
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    if (!plain) return setError("Content wajib diisi.");

    if (!tags.length)
      return setError("Tags wajib diisi (pisahkan dengan koma).");

    // image saat edit OPTIONAL, tapi kalau dipilih tetap validasi
    if (image) {
      const maxBytes = 5 * 1024 * 1024;
      if (image.size > maxBytes) return setError("Ukuran gambar melebihi 5MB.");
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("content", contentHtml);
      tags.forEach((t) => fd.append("tags", t));

      // Kalau user pilih cover baru, kirim
      // (field file create )
      if (image) fd.append("image", image);

      // ⚠️ jangan set Content-Type manual, biar axios set boundary
      const res = await api.patch<PostDetailResponse>(`/posts/${postId}`, fd);

      setOk(`Berhasil update post: ${res.data?.title ?? "(ok)"}`);

      // refresh cover lama dari response (kalau backend balikin)
      if (res.data?.imageUrl) setExistingImageUrl(res.data.imageUrl);

      // redirect balik ke profile + refresh
      router.replace("/profile?updated=1");
      router.refresh();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Gagal update post.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  if (!postId) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Invalid post URL (missing id).
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-[22px] font-semibold text-slate-800">
            Edit Post
          </div>

          <button
            type="button"
            className="text-sm text-sky-700 hover:underline"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>

        {loadingPage ? (
          <div className="text-sm text-slate-600">Loading...</div>
        ) : (
          <>
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title
              </label>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Enter your title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Content
              </label>

              <TiptapEditor
                value={contentHtml}
                onChange={setContentHtml}
                placeholder="Enter your content"
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cover Image
              </label>

              <label className="block cursor-pointer rounded-md border-2 border-dashed border-slate-200 p-6 text-center hover:bg-slate-50">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                />

                {!image ? (
                  <div className="space-y-3">
                    {/* tampilkan cover lama kalau ada */}
                    {existingImageUrl ? (
                      <>
                        <div className="text-sm text-slate-700 font-medium">
                          Current cover:
                        </div>
                        <img
                          src={`${existingImageUrl}?v=${Date.now()}`}
                          alt="current cover"
                          className="mx-auto max-h-56 rounded-md border border-slate-200 object-cover"
                        />
                        <div className="text-xs text-slate-500">
                          Klik untuk ganti cover (PNG/JPG max 5MB). Atau biarkan
                          kosong untuk tetap pakai cover lama.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mx-auto h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center">
                          ⬆️
                        </div>
                        <div className="text-sm text-slate-700 font-medium">
                          Click to upload or drag and drop
                        </div>
                        <div className="text-xs text-slate-500">
                          PNG or JPG (max. 5mb)
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-slate-700 font-medium">
                      {image.name}
                    </div>
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="cover preview"
                        className="mx-auto max-h-56 rounded-md border border-slate-200 object-cover"
                      />
                    )}
                    <button
                      type="button"
                      className="text-sm text-rose-600 hover:underline"
                      onClick={(ev) => {
                        ev.preventDefault();
                        setImage(null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </label>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tags
              </label>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Enter your tags"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
              />

              {!!tags.length && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Alerts */}
            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}
            {ok && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {ok}
              </div>
            )}

            {/* Finish Button */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="min-w-40 rounded-full bg-sky-600 text-white px-6 py-2 text-sm font-medium hover:bg-sky-700 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Finish"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
