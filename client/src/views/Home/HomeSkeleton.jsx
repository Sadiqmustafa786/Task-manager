// client/src/views/Home/HomeSkeleton.jsx
import React from "react";

const HomeSkeleton = () => {
  const numbers = Array.from({ length: 30 }, (_, index) => index + 1);

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 md:py-5 space-y-4 sm:space-y-5 md:space-y-6">
      {/* Welcome Section Skeleton */}
      <div className="bg-gray-200 animate-pulse h-[180px] flex justify-between p-4 w-full rounded-2xl">
        <div className="flex flex-col gap-3 flex-1">
          <div className="bg-gray-300 h-8 w-48 rounded-lg"></div>
          <div className="bg-gray-300 h-6 w-64 rounded-lg"></div>
          <div className="bg-gray-300 h-10 w-32 rounded-full"></div>
        </div>
        <div className="hidden sm:block bg-gray-300 w-48 h-48 rounded-lg"></div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-3">
        <div className="animate-pulse flex gap-6 rounded-lg">
          <div className="bg-gray-200 h-[40px] w-[120px] rounded-full"></div>
          <div className="bg-gray-200 h-[40px] w-[120px] rounded-full"></div>
          <div className="bg-gray-200 h-[40px] w-[120px] rounded-full"></div>
        </div>
        <div className="animate-pulse flex gap-6 rounded-lg">
          <div className="bg-gray-200 h-[30px] w-[80px] rounded-full"></div>
          <div className="bg-gray-200 h-[30px] w-[80px] rounded-full"></div>
        </div>
      </div>

      {/* Task List Skeleton */}
      <div className="bg-gray-200 animate-pulse h-48 p-4 w-full rounded-lg space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="bg-gray-300 h-6 w-6 rounded"></div>
            <div className="bg-gray-300 h-4 w-32 rounded"></div>
            <div className="bg-gray-300 h-4 w-24 rounded"></div>
            <div className="bg-gray-300 h-4 w-20 rounded ml-auto"></div>
          </div>
        ))}
      </div>

      {/* Calendar Skeleton */}
      <div className="bg-gray-200 animate-pulse p-4 w-full rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gray-300 h-10 w-10 rounded-full"></div>
            <div className="bg-gray-300 h-10 w-10 rounded-full"></div>
          </div>
          <div className="bg-gray-300 h-8 w-40 rounded-lg"></div>
          <div className="flex items-center gap-4">
            <div className="bg-gray-300 h-8 w-24 rounded-full"></div>
            <div className="bg-gray-300 h-8 w-24 rounded-full"></div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-gray-300 h-6 w-10 rounded"></div>
          ))}
          {numbers.map((i) => (
            <div
              key={i}
              className="w-full h-[100px] bg-gray-300 rounded-xl"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeSkeleton;
