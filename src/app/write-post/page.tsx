"use client";

import React, { useMemo, useState } from "react";
import TiptapEditor from "@/components/TiptapEditor";
import { api } from "@/lib/axios"; // axios di src/lib/axios.ts

function parseTags(input: string) {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

type FieldKey = "title" | "content" | "image" | "tags";

export default function WritePostPage() {
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState(""); // HTML dari tiptap
  const [tagsText, setTagsText] = useState("");
  const tags = useMemo(() => parseTags(tagsText), [tagsText]);

  const [image, setImage] = useState<File | null>(null);
  const imagePreview = useMemo(
    () => (image ? URL.createObjectURL(image) : ""),
    [image],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  //  tambah: touched + errors per field
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    title: false,
    content: false,
    image: false,
    tags: false,
  });

  const maxBytes = 5 * 1024 * 1024;

  const errors = useMemo(() => {
    const e: Partial<Record<FieldKey, string>> = {};

    if (!title.trim()) e.title = "The title is required.";

    const plain = stripHtml(contentHtml);
    if (!plain) e.content = "Content is required.";

    if (!tags.length) e.tags = "Tags are required (separate with commas).";

    if (!image) {
      e.image = "Cover image is required (PNG/JPG, max 5MB).";
    } else {
      const okType =
        image.type === "image/png" ||
        image.type === "image/jpeg" ||
        image.type === "image/jpg";
      if (!okType) e.image = "Image format must be PNG or JPG.";
      else if (image.size > maxBytes) e.image = "Image size exceeds 5MB.";
    }

    return e;
  }, [title, contentHtml, tags.length, image]);

  const showError = (k: FieldKey) => touched[k] && !!errors[k];

  async function handleSubmit() {
    setError(null);
    setOk(null);

    // tampilkan semua error per-field saat submit
    setTouched({ title: true, content: true, image: true, tags: true });

    //  kalau ada error field, stop (bukan error global)
    if (errors.title || errors.content || errors.tags || errors.image) return;

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("content", contentHtml);

      // tags array<string> -> append berkali-kali
      tags.forEach((t) => fd.append("tags", t));

      // field file harus 'image'
      if (image) fd.append("image", image);

      const res = await api.post("/posts", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setOk(`Berhasil buat post: ${res.data?.title ?? "(ok)"}`);

      // reset
      setTitle("");
      setContentHtml("");
      setTagsText("");
      setImage(null);

      //  reset touched
      setTouched({ title: false, content: false, image: false, tags: false });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Gagal create post.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold --black-alt-300 mb-2">
            Title
          </label>
          <input
            className={[
              "w-full rounded-md border px-3 py-2 outline-none text-sm",
              showError("title")
                ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                : "border-slate-200 focus:ring-2 focus:ring-sky-200",
            ].join(" ")}
            placeholder="Enter your title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, title: true }))}
          />
          {showError("title") && (
            <p className="mt-1 text-xs text-rose-600">{errors.title}</p>
          )}
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold --black-alt-300 mb-2">
            Content
          </label>

          {/*  wrapper untuk kasih border merah ke area editor */}
          <div
            className={[
              "rounded-md",
              showError("content") ? "ring-1 ring-rose-400" : "",
            ].join(" ")}
            onBlurCapture={() => setTouched((p) => ({ ...p, content: true }))}
          >
            <TiptapEditor
              value={contentHtml}
              onChange={(v) => {
                setContentHtml(v);
                if (!touched.content) return;
                // biar realtime update error setelah udah pernah disentuh
                // (errors dihitung via useMemo)
              }}
              placeholder="Enter your content"
            />
          </div>

          {showError("content") && (
            <p className="mt-1 text-xs text-rose-600">{errors.content}</p>
          )}
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-semibold --black-alt-300 mb-2">
            Cover Image
          </label>

          <label
            className={[
              "block cursor-pointer rounded-md border-2 border-dashed p-6 text-center hover:bg-slate-50",
              showError("image") ? "border-rose-400" : "border-slate-200",
            ].join(" ")}
          >
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                setImage(e.target.files?.[0] ?? null);
                setTouched((p) => ({ ...p, image: true }));
              }}
            />

            {!image ? (
              <div className="space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full flex items-center justify-center">
                  <img src="/upload-icon.svg" alt="Upload" />
                </div>
                <div className="text-sm text-(--gray-alt-500) font-normal">
                  <span className="text-(--blue-alt) font-semibold">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </div>
                <div className="text-xs text-slate-500">
                  PNG or JPG (max. 5mb)
                </div>
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
                    setTouched((p) => ({ ...p, image: true }));
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </label>

          {showError("image") && (
            <p className="mt-1 text-xs text-rose-600">{errors.image}</p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold --black-alt-300 mb-1">
            Tags
          </label>
          <input
            className={[
              "w-full rounded-md border px-3 py-2 outline-none text-sm",
              showError("tags")
                ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                : "border-slate-200 focus:ring-2 focus:ring-sky-200",
            ].join(" ")}
            placeholder="Enter your tags"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, tags: true }))}
          />

          {showError("tags") && (
            <p className="mt-1 text-xs text-rose-600">{errors.tags}</p>
          )}

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

        {/* Alerts (server/global) */}
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
        <div className="flex justify-end pt-2 ">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="md:min-w-40 min-w-full rounded-full bg-(--blue-alt) text-white px-6 py-2 text-sm font-medium hover:bg-sky-700 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Saving..." : "Finish"}
          </button>
        </div>
      </div>
    </main>
  );
}
