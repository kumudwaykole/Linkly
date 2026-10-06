"use client";

import { useState, type FormEvent } from "react";

type CreatedLink = {
  id: string;
  code: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: string;
};

export default function Home() {
  // State holds the input, API result, and feedback displayed on the page.
  const [originalUrl, setOriginalUrl] = useState("");
  const [link, setLink] = useState<CreatedLink | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setLink(null);
    setCopyMessage("");

    // Trim the submitted value and permit only web destinations.
    const destination = originalUrl.trim();
    try {
      const parsedUrl = new URL(destination);
      if (!["http:", "https:"].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
        throw new Error("Use an HTTP or HTTPS URL without embedded credentials.");
      }
    } catch {
      setError("Enter a complete HTTP or HTTPS URL, such as https://example.com.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Next.js forwards this same-origin request to the Express backend.
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: destination }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = typeof data?.error === "string" ? data.error : `Could not create the link (HTTP ${response.status}). Check the backend terminal.`;
        throw new Error(message);
      }
      if (!data || typeof data.shortUrl !== "string" || typeof data.code !== "string") {
        throw new Error("The backend response is missing shortUrl or code.");
      }
      const returnedUrl = new URL(data.shortUrl);
      if (!["http:", "https:"].includes(returnedUrl.protocol)) {
        throw new Error("The backend returned an invalid short URL.");
      }
      setLink(data as CreatedLink);
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : "Unable to reach the backend. Make sure it is running.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopyMessage("Copied!");
    } catch {
      setCopyMessage("Could not copy automatically. Select and copy the URL above.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
      <p className="mb-3 text-sm font-semibold tracking-wide text-indigo-600">LINKLY</p>
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">Make your links shorter.</h1>
      <p className="mt-4 text-slate-600">Paste a destination URL to create a short link.</p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label htmlFor="original-url" className="block text-sm font-medium text-slate-900">Destination URL</label>
        <input
          id="original-url"
          name="originalUrl"
          type="url"
          required
          value={originalUrl}
          onChange={(event) => setOriginalUrl(event.target.value)}
          placeholder="https://example.com/your-long-link"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
        />
        <button type="submit" disabled={isSubmitting} className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60">
          {isSubmitting ? "Creating…" : "Shorten URL"}
        </button>
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      </form>

      {link && (
        <section aria-label="Created link" aria-live="polite" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="font-semibold text-emerald-900">Your short link is ready</h2>
          <a href={link.shortUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block break-all font-medium text-indigo-700 underline">{link.shortUrl}</a>
          <p className="mt-3 break-all text-sm text-slate-600">Destination: {link.originalUrl}</p>
          <p className="mt-1 text-sm text-slate-600">Code: {link.code}</p>
          <button type="button" onClick={copyLink} className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">Copy short URL</button>
          <p role="status" className="mt-2 text-sm text-slate-600">{copyMessage}</p>
        </section>
      )}
    </main>
  );
}

