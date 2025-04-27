"use client";

/**
 * Global error boundary for the application.
 *
 * Why: Catching and displaying errors gracefully improves user experience and debuggability.
 * This component is used by Next.js to render a fallback UI when an error is thrown in a server or client component.
 *
 * The reset function allows users to retry the failed action, which is especially useful for transient errors.
 *
 * See: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#errorjs
 */
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col max-w-xl p-8 mx-auto my-4 bg-white border rounded-lg border-neutral-200 md:p-12 dark:border-neutral-800 dark:bg-black">
      <h2 className="text-xl font-bold">Oh no!</h2>
      <p className="my-2">
        There was an issue with our storefront. This could be a temporary issue,
        please try your action again.
      </p>
      <button
        className="flex items-center justify-center w-full p-4 mx-auto mt-4 tracking-wide text-white bg-blue-600 rounded-full hover:opacity-90"
        onClick={() => reset()}
      >
        Try Again
      </button>
    </div>
  );
}
