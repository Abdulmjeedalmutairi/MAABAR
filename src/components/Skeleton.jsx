import React from 'react';

// Shimmer loading placeholders. With the SWR cache in place, a real loading
// state only shows on a cold miss (first visit) — these make that first paint
// feel like the page is arriving, not blank. `.mb-skeleton` (index.css) carries
// the shimmer + prefers-reduced-motion guard.

export function Skeleton({ width = '100%', height = 12, radius, style }) {
  return (
    <span
      className="mb-skeleton"
      style={{ display: 'block', width, height, ...(radius != null ? { borderRadius: radius } : {}), ...style }}
      aria-hidden="true"
    />
  );
}

// One product/browse card: image block, two title lines, a price line, a button.
function ProductCardSkeleton() {
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <Skeleton height={150} radius={0} />
      <div style={{ padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Skeleton width="85%" height={13} />
        <Skeleton width="55%" height={13} />
        <Skeleton width="40%" height={16} style={{ marginTop: 4 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Skeleton height={34} radius="var(--radius-control)" />
          <Skeleton height={34} radius="var(--radius-control)" />
        </div>
      </div>
    </div>
  );
}

// One factory card: cover strip, name line, two meta lines.
function FactoryCardSkeleton() {
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <Skeleton height={120} radius={0} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton width="70%" height={15} />
        <Skeleton width="45%" height={11} />
        <Skeleton width="30%" height={11} />
      </div>
    </div>
  );
}

// Responsive grid of card skeletons. variant: 'product' | 'factory'.
export function CardGridSkeleton({ count = 8, variant = 'product', minWidth = 220 }) {
  const Card = variant === 'factory' ? FactoryCardSkeleton : ProductCardSkeleton;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`, gap: 16 }} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => <Card key={i} />)}
    </div>
  );
}

export default Skeleton;
