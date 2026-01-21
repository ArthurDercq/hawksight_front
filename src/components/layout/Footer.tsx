export function Footer() {
  return (
    <footer className="w-full px-6 mt-12 pb-6">
      <div className="flex items-center justify-between pt-6 border-t border-steel/20">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-amber" />
            <span className="w-1 h-1 rounded-full bg-glacier" />
            <span className="w-1 h-1 rounded-full bg-moss" />
          </div>
          <span className="text-steel font-mono text-xs">HawkSight Analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
          <span className="text-steel font-mono text-xs">Live</span>
        </div>
      </div>
    </footer>
  );
}
