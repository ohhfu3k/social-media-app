#!/usr/bin/env node
// Triggers Netlify deploy via Build Hook URL from env NETLIFY_BUILD_HOOK_URL
const url = process.env.NETLIFY_BUILD_HOOK_URL;
if (!url) {
  console.error("NETLIFY_BUILD_HOOK_URL env var is required. Add it to your CI or local env.");
  process.exit(1);
}
async function main() {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      console.error(`Failed: ${res.status} ${res.statusText}`);
      process.exit(1);
    }
    console.log("Netlify deploy triggered successfully.");
  } catch (err) {
    console.error("Error triggering Netlify hook:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
main();
