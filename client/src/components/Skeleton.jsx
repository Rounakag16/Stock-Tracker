// Skeleton placeholders shown while a page's data loads. Each page gets a
// skeleton shaped like its real layout, so content fills in where the grey
// blocks were instead of jumping in after a spinner.
//
// The shimmer comes from the `.skeleton` class in index.css (it is static
// for people who prefer reduced motion).

export function Skeleton({ className = "" }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-hidden="true" />;
}

// Wraps a skeleton so screen readers announce a loading state once,
// instead of reading out every grey block.
function Loading({ label = "Loading", className = "", children }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}

export function PageHeaderSkeleton({ actions = 0, subtitle = true }) {
  return (
    <div className="admin-page-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="space-y-2.5">
        <Skeleton className="h-8 w-48 lg:h-9" />
        {subtitle && <Skeleton className="h-4 w-64 max-w-full" />}
      </div>
      {actions > 0 && (
        <div className="flex gap-2">
          {Array.from({ length: actions }).map((_, i) => (
            <Skeleton key={i} className="h-11 flex-1 sm:flex-none sm:w-32 rounded-xl" />
          ))}
        </div>
      )}
    </div>
  );
}

export function StatGridSkeleton({ count = 4, className = "grid-cols-2 lg:grid-cols-4" }) {
  return (
    <div className={`grid gap-3 sm:gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 sm:p-5 space-y-3">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

// A stack of cards, each with a title line, a few detail lines and an
// optional row of buttons — matches the item/request/warehouse cards.
export function CardListSkeleton({ count = 4, lines = 2, actions = 0, badge = false, kebab = false }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className={`h-5 ${i % 2 ? "w-2/5" : "w-3/5"}`} />
              {Array.from({ length: lines }).map((__, j) => (
                <Skeleton key={j} className={`h-3.5 ${j % 2 ? "w-1/3" : "w-1/2"}`} />
              ))}
            </div>
            {badge && <Skeleton className="h-7 w-12" />}
          </div>
          {actions > 0 && (
            <div className="flex gap-2 mt-3">
              {Array.from({ length: actions }).map((__, j) => (
                <Skeleton key={j} className="h-11 flex-1 rounded-xl" />
              ))}
              {kebab && <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex gap-6 px-5 py-3.5 border-b border-line bg-slate-50/50">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-6 px-5 py-4">
            {Array.from({ length: cols }).map((__, c) => (
              <Skeleton key={c} className={`h-4 flex-1 ${c === 0 ? "" : "opacity-70"}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Card list on phones, table on desktop — the Stock page's two layouts.
function ResponsiveListSkeleton({ rows = 6, cols = 5, cardActions = 3, kebab = false }) {
  return (
    <>
      <div className="lg:hidden">
        <CardListSkeleton count={Math.min(rows, 5)} lines={1} actions={cardActions} badge kebab={kebab} />
      </div>
      <div className="hidden lg:block">
        <TableSkeleton rows={rows} cols={cols} />
      </div>
    </>
  );
}

// --- Page-level skeletons ---

export function DashboardSkeleton() {
  return (
    <Loading label="Loading dashboard" className="page-container">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={5} className="grid-cols-2 lg:grid-cols-5 mb-6 lg:mb-8" />
      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="card p-5 space-y-3">
            <Skeleton className="h-5 w-36" />
            {[0, 1, 2].map((j) => (
              <div key={j} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-6 w-10" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </Loading>
  );
}

export function StockSkeleton() {
  return (
    <Loading label="Loading stock" className="page-container">
      <div className="admin-page-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2.5">
          <Skeleton className="h-8 w-56 lg:h-9" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <Skeleton className="h-11 col-span-2 sm:col-span-1 sm:order-last sm:w-32 rounded-xl" />
          <Skeleton className="h-11 sm:w-32 rounded-xl" />
          <Skeleton className="h-11 sm:w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:flex gap-3 mb-4">
        <Skeleton className="h-11 col-span-2 sm:flex-1 rounded-xl" />
        <Skeleton className="h-11 sm:w-48 rounded-xl" />
        <Skeleton className="h-11 sm:w-48 rounded-xl" />
      </div>
      <ResponsiveListSkeleton rows={7} cols={5} cardActions={2} kebab />
    </Loading>
  );
}

// Generic "header + list of cards" page: Warehouses, Team, Tags.
export function ListPageSkeleton({ label, count = 3, lines = 1, actions = 2, headerActions = 1 }) {
  return (
    <Loading label={label} className="page-container">
      <PageHeaderSkeleton actions={headerActions} />
      <CardListSkeleton count={count} lines={lines} actions={actions} />
    </Loading>
  );
}

export function RequestsSkeleton() {
  return (
    <Loading label="Loading requests">
      <CardListSkeleton count={3} lines={4} actions={3} />
    </Loading>
  );
}

export function LogsSkeleton() {
  return (
    <Loading label="Loading activity" className="page-container">
      <PageHeaderSkeleton actions={2} />
      <CardListSkeleton count={6} lines={3} />
    </Loading>
  );
}

export function DailySkeleton() {
  return (
    <Loading label="Loading report">
      <StatGridSkeleton count={6} className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-6" />
      <div className="mb-8">
        <ResponsiveListSkeleton rows={6} cols={8} cardActions={0} />
      </div>
      <CardListSkeleton count={3} lines={2} />
    </Loading>
  );
}

export function SettingsSkeleton() {
  return (
    <Loading label="Loading settings" className="page-container max-w-2xl">
      <PageHeaderSkeleton />
      {[0, 1, 2].map((i) => (
        <div key={i} className="card p-5 sm:p-6 mb-6 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-24 rounded-xl" />
        </div>
      ))}
    </Loading>
  );
}

export function HistorySkeleton() {
  return (
    <Loading label="Loading history" className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-line p-3 space-y-2">
          <div className="flex justify-between gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      ))}
    </Loading>
  );
}

// Employee portal: warehouse picker, search, and item cards with 3 buttons.
export function EmployeeStockSkeleton({ withControls = true }) {
  return (
    <Loading label="Loading stock" className={withControls ? "page-container max-w-2xl" : ""}>
      {withControls && (
        <>
          <div className="mb-6 space-y-2.5">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="space-y-3 mb-4">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </>
      )}
      <CardListSkeleton count={4} lines={0} actions={3} badge />
    </Loading>
  );
}

// Shown while the admin session is checked, before any page renders:
// sidebar on desktop, header + bottom bar on phones.
export function AdminShellSkeleton() {
  return (
    <Loading label="Loading" className="min-h-screen bg-paper">
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:left-0 bg-white border-r border-line">
        <div className="p-6 border-b border-line flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="p-4 space-y-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-xl" />
          ))}
        </div>
      </aside>
      <header className="lg:hidden flex items-center gap-2.5 px-4 py-2.5 border-b border-line">
        <Skeleton className="w-8 h-8" />
        <Skeleton className="h-4 w-40" />
      </header>
      <div className="lg:ml-60">
        <DashboardSkeleton />
      </div>
      <div className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-white border-t border-line grid grid-cols-5 items-center px-4 gap-6 pb-safe">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-6 mx-auto rounded-md" />
        ))}
      </div>
    </Loading>
  );
}
