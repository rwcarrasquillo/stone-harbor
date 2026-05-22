#!/usr/bin/env node
/**
 * Stone Harbor — Unsplash nature image fetcher (API version).
 *
 * Uses Unsplash's official developer API rather than scraping their
 * public photo pages — which they now gate behind authentication and
 * bot protection (returns 401 to direct requests).
 *
 * Reads scripts/unsplash-nature-manifest.json. For each entry:
 *   1. Extracts the photo ID from the page URL's trailing segment.
 *   2. Calls GET https://api.unsplash.com/photos/{id} with the
 *      Authorization: Client-ID header.
 *   3. Pings the photo's `download_location` to register the download
 *      with Unsplash (their API guideline — keeps photographer stats
 *      accurate and respects their attribution culture).
 *   4. Downloads the photo from urls.raw with our preferred size + quality.
 *   5. Processes with sharp, saves to public/nature/{slug}.jpg.
 *   6. Writes public/IMAGE_CREDITS.md crediting each photographer with
 *      a link to their Unsplash profile (UTM-tagged per their guidelines).
 *
 * Setup:
 *   1. Get a free Access Key at https://unsplash.com/oauth/applications
 *   2. Add to .env.local:  UNSPLASH_ACCESS_KEY=your_key_here
 *   3. Run:  node scripts/fetch-unsplash-nature.mjs
 *
 * Rate limit:
 *   The Unsplash free tier allows 50 requests/hour. This script makes
 *   ~26 requests per full run (one /photos/{id} + one download_location
 *   ping per entry). Plenty of headroom.
 *
 * Idempotency:
 *   Existing JPGs in public/nature/ are skipped. Pass --force to redo.
 *   IMAGE_CREDITS.md is always regenerated based on the manifest.
 */

import { readFileSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = resolve(__dirname, "unsplash-nature-manifest.json");
const OUT_DIR = resolve(ROOT, "public/nature");
const CREDITS_PATH = resolve(ROOT, "public/IMAGE_CREDITS.md");
const ENV_PATH = resolve(ROOT, ".env.local");

const FORCE = process.argv.includes("--force");

/**
 * Read a key from process.env first, then from .env.local as a
 * fallback. No dotenv dep — Stone Harbor only needs one variable
 * here so a tiny inline parser is enough.
 */
function readEnvKey(name) {
  if (process.env[name]) return process.env[name];
  if (!existsSync(ENV_PATH)) return null;
  try {
    const content = readFileSync(ENV_PATH, "utf8");
    for (const rawLine of content.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      if (key !== name) continue;
      let value = line.slice(eq + 1).trim();
      // Strip surrounding quotes if present.
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return value;
    }
  } catch {
    return null;
  }
  return null;
}

const ACCESS_KEY = readEnvKey("UNSPLASH_ACCESS_KEY");

if (!ACCESS_KEY) {
  console.error(
    "\n[error] UNSPLASH_ACCESS_KEY not found.\n" +
      "  Get one at: https://unsplash.com/oauth/applications\n" +
      `  Then add it to .env.local (located at ${ENV_PATH}):\n\n` +
      "    UNSPLASH_ACCESS_KEY=your_key_here\n",
  );
  process.exit(1);
}

if (!existsSync(MANIFEST_PATH)) {
  console.error("[error] manifest not found at", MANIFEST_PATH);
  process.exit(1);
}
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
console.log(`[unsplash] manifest has ${manifest.length} entries`);
console.log(`[unsplash] using API key ${ACCESS_KEY.slice(0, 6)}…`);

/**
 * Extract the Unsplash photo ID from a page URL.
 *
 * URL shapes Unsplash uses:
 *   https://unsplash.com/photos/{slug}-{photoId}
 *   https://unsplash.com/photos/{photoId}   (older / shortlink form)
 *
 * The photo ID is always the trailing alphanumeric segment after
 * the final hyphen (if any), and is always 11 characters of
 * [A-Za-z0-9_-].
 */
function extractPhotoId(pageUrl) {
  try {
    const u = new URL(pageUrl);
    const lastSegment = u.pathname.split("/").filter(Boolean).pop();
    if (!lastSegment) return null;
    // Photo ID is the trailing chunk after the last hyphen.
    const parts = lastSegment.split("-");
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

/**
 * Add our preferred size/quality params to the Unsplash CDN URL.
 */
function shapedDownloadUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.searchParams.set("w", "1600");
    u.searchParams.set("q", "82");
    u.searchParams.set("fm", "jpg");
    u.searchParams.set("fit", "max");
    return u.toString();
  } catch {
    return rawUrl;
  }
}

async function apiGet(path) {
  const res = await fetch(`https://api.unsplash.com${path}`, {
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`,
      "Accept-Version": "v1",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Unsplash API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function processEntry(entry) {
  const outPath = resolve(OUT_DIR, `${entry.slug}.jpg`);
  const photoId = extractPhotoId(entry.pageUrl);

  if (!photoId) {
    console.warn(`[skip] ${entry.slug}: could not parse photo ID from URL`);
    return null;
  }

  // 1. Pull metadata from the API.
  let photo;
  try {
    photo = await apiGet(`/photos/${photoId}`);
  } catch (err) {
    console.warn(`  ✗ ${entry.slug}: API lookup failed — ${err.message}`);
    return null;
  }

  const photographer = photo.user?.name || "Unknown";
  const photographerLink = photo.user?.links?.html
    ? `${photo.user.links.html}?utm_source=stone-harbor&utm_medium=referral`
    : null;
  const photoPageLink =
    photo.links?.html ||
    entry.pageUrl ||
    `https://unsplash.com/photos/${photoId}`;

  // 2. Idempotency — skip download if file already exists (unless --force).
  if (!FORCE && existsSync(outPath)) {
    console.log(
      `[skip] ${entry.slug}.jpg already exists (use --force to redo) — credit: ${photographer}`,
    );
    return {
      slug: entry.slug,
      file: `/nature/${entry.slug}.jpg`,
      pageUrl: photoPageLink,
      photographer,
      photographerLink,
      theme: entry.theme,
      mood: entry.mood,
    };
  }

  console.log(`[fetch] ${entry.slug} (${photoId}) by ${photographer}`);

  // 3. Hit the download_location to register with Unsplash (best
  // practice per their API guidelines, keeps photographer download
  // counts accurate). Failure here is non-fatal.
  if (photo.links?.download_location) {
    try {
      await apiGet(
        photo.links.download_location.replace(
          "https://api.unsplash.com",
          "",
        ),
      );
    } catch (err) {
      console.warn(`  ⚠ download tracking failed: ${err.message}`);
    }
  }

  // 4. Download the photo from urls.raw with our size/quality params.
  const rawUrl = photo.urls?.raw;
  if (!rawUrl) {
    console.warn(`  ✗ ${entry.slug}: no raw URL in API response`);
    return null;
  }

  const downloadUrl = shapedDownloadUrl(rawUrl);
  const imgRes = await fetch(downloadUrl);
  if (!imgRes.ok) {
    console.warn(`  ✗ ${entry.slug}: image download failed (${imgRes.status})`);
    return null;
  }
  const buf = Buffer.from(await imgRes.arrayBuffer());

  // 5. Process with sharp — cap at 1600x1200, quality 82, mozjpeg.
  await sharp(buf)
    .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outPath);

  console.log(`  ✓ ${entry.slug}.jpg`);

  return {
    slug: entry.slug,
    file: `/nature/${entry.slug}.jpg`,
    pageUrl: photoPageLink,
    photographer,
    photographerLink,
    theme: entry.theme,
    mood: entry.mood,
  };
}

function writeCreditsFile(records) {
  const lines = [
    "# Stone Harbor — Image Credits",
    "",
    "All photographs in `/public/nature/` are sourced from Unsplash under",
    "the [Unsplash License](https://unsplash.com/license).",
    "",
    "Attribution is not required by that license, but Stone Harbor credits",
    "the photographers as a matter of brand integrity and an audit trail.",
    "If you are a photographer listed below and would prefer your work be",
    "removed, please contact us — we will replace it within 48 hours.",
    "",
    "| Image | Photographer | Source | Theme |",
    "| --- | --- | --- | --- |",
  ];

  for (const r of records) {
    if (!r) continue;
    const photographerCell = r.photographerLink
      ? `[${r.photographer}](${r.photographerLink})`
      : r.photographer;
    lines.push(
      `| \`${r.file}\` | ${photographerCell} | [Unsplash](${r.pageUrl}) | ${r.theme} · ${r.mood} |`,
    );
  }

  lines.push("");
  lines.push(`_Last generated: ${new Date().toISOString().slice(0, 10)}_`);
  lines.push("");

  writeFileSync(CREDITS_PATH, lines.join("\n"));
  console.log(`[credits] wrote ${CREDITS_PATH}`);
}

async function main() {
  const records = [];
  for (const entry of manifest) {
    try {
      const record = await processEntry(entry);
      if (record) records.push(record);
    } catch (err) {
      console.error(`[error] ${entry.slug}:`, err.message);
    }
    // Tiny politeness delay between API calls (~120ms). Free tier
    // is 50 req/hour, but bursting can occasionally trigger throttling.
    await new Promise((r) => setTimeout(r, 120));
  }
  writeCreditsFile(records);
  console.log(`\n[done] processed ${records.length} / ${manifest.length} entries`);
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
