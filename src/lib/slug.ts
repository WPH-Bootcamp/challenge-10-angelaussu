export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // buang simbol
    .replace(/\s+/g, "-") // spasi jadi -
    .replace(/-+/g, "-"); // rapikan ---
}

export function makePostSlug(id: number | string, title: string) {
  return `${id}-${slugify(title)}`;
}

export function extractIdFromPostSlug(slug: string) {
  const match = slug.match(/^(\d+)/); // ambil angka di awal
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}
