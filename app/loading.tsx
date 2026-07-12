export default function Loading() {
  return (
    <div className="space-y-6" aria-label="页面加载中">
      <div className="h-24 animate-pulse rounded-lg bg-slate-200/80" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg bg-white" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-lg bg-white" />
    </div>
  );
}
