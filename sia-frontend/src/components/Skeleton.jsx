import React from 'react';
import { cn } from '../lib/utils';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      {...props}
    />
  );
};

export { Skeleton };

export const TableRowSkeleton = ({ columns = 8 }) => {
  return (
    <tr className="border-b border-slate-50">
      <td className="px-6 py-4"><Skeleton className="h-4 w-4" /></td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-32" />
        </div>
      </td>
      <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
      <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
      <td className="px-5 py-4"><Skeleton className="h-6 w-10 rounded-lg" /></td>
      <td className="px-5 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
      <td className="px-5 py-4"><Skeleton className="h-6 w-20 rounded-lg" /></td>
      <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
      <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></td>
    </tr>
  );
};
