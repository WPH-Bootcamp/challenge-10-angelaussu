export default function PostCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border bg-white">
      <div className="h-44 w-full bg-gray-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-5/6 rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-5 w-14 rounded-full bg-gray-200" />
          <div className="h-5 w-12 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
