import React from 'react';
export function Skeleton({ className='' }) { return <div className={`animate-pulse bg-gray-200 dark:bg-neutral-700 rounded ${className}`} />; }
export function SkeletonText({ lines=3 }) { return <div className="space-y-2">{Array.from({length:lines}).map((_,i)=><Skeleton key={i} className={`h-3 ${i===lines-1?'w-1/2':'w-full'}`} />)}</div>; }
