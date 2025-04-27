// robots.ts generates the robots.txt file for the app.
//
// Why: This file tells search engines which parts of the site to crawl or ignore.
// By generating it dynamically, we can adjust rules based on environment or business needs.
//
// See: https://nextjs.org/docs/app/building-your-application/optimizing/metadata#robots

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : "http://localhost:3000";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*", // Allow all user agents (search engines) by default
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`, // Point to the dynamic sitemap
    host: baseUrl, // Explicitly set the canonical host
  };
}
