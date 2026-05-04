import React from "react";

export const DriveSkeleton = ({ orderData }: { orderData?: any } = {}) => (
  <div id="drive-skeleton-container" className="min-h-screen bg-gray-50">
    {/* Skeleton Header */}
    <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 bg-gray-100 rounded-xl animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
        <div className="h-2.5 w-20 bg-gray-50 rounded animate-pulse" />
      </div>
    </div>
    {/* Skeleton Info Bar */}
    <div className="px-3 pt-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="h-20 bg-amber-100 rounded-2xl animate-pulse" />
        <div className="h-20 bg-red-100 rounded-2xl animate-pulse" />
      </div>
    </div>
    {/* Skeleton Tabs */}
    <div className="px-3 py-2 flex gap-2">
      <div className="h-8 w-20 bg-gray-100 rounded-full animate-pulse" />
      <div className="h-8 w-20 bg-gray-100 rounded-full animate-pulse" />
    </div>
    {/* Skeleton Grid */}
    <div className="px-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3">
            <div className="aspect-square bg-gray-50 rounded-xl animate-pulse mb-2" />
            <div className="h-2.5 w-3/4 mx-auto bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
