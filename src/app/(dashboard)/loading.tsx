export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="h-8 w-1/3 animate-pulse rounded-lg bg-border" />
      <div className="h-48 w-full animate-pulse rounded-xl bg-border" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-32 w-full animate-pulse rounded-xl bg-border" />
        <div className="h-32 w-full animate-pulse rounded-xl bg-border" />
      </div>
    </div>
  );
}
