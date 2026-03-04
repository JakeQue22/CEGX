'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
      <div className="max-w-md w-full bg-white rounded-xl border border-red-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-600 mb-4">
          An unexpected error occurred. Please try again.
        </p>
        {process.env.NODE_ENV !== 'production' && (
          <p className="text-xs text-gray-500 mb-4 break-words">{error.message}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
