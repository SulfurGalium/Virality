import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center"
      aria-labelledby="not-found-heading"
    >
      <h1
        id="not-found-heading"
        className="text-xl font-medium text-gray-900"
      >
        Page not found
      </h1>

      <p className="text-sm text-gray-500 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>

      <Link
        href="/"
        className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        Go to home page
      </Link>
    </main>
  );
}
