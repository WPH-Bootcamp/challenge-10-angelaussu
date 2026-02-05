import { Suspense } from "react";
import SearchClientPage from "./SearchClientPage";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="px-6 py-10">Loading...</div>}>
      <SearchClientPage />
    </Suspense>
  );
}
