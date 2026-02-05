import Link from "next/link";

export default function PostsPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">Posts</h1>
      <p className="mt-2 text-gray-600">Pilih post dari halaman home / list.</p>

      <Link className="mt-6 inline-block underline" href="/">
        Kembali ke Home
      </Link>
    </section>
  );
}
