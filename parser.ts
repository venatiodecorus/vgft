/// <reference types="npm:@types/node" />
// import * as cheerio from "npm:cheerio"; // alt option, jsdom?
import { config } from "./config.ts";
import { ensureDirSync } from "https://deno.land/std@0.218.2/fs/ensure_dir.ts";
import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

/**
 * Iterate through configured sources and cache them
 */
export async function parseSources() {
  for (const source of config.sources) {
    // Store the URL of pages we've already cached
    const pages: { [key: string]: boolean } = {};
    pages[source] = false;

    // Iterate through all pages until we've cached them all
    while (Object.values(pages).includes(false)) {
      for (const [page, visited] of Object.entries(pages)) {
        try {
          if (visited) {
            continue;
          }
          const { content, links } = await parsePage(page);
          // Add links to pages object
          links.forEach((link) => {
            if (link !== null && !pages[link]) {
              pages[link] = false;
            }
          });
          // Write the page to the cache
          cacheFile(page, content);

          console.log(`Cached ${page}`);
          pages[page] = true;
        } catch (error) {
          console.error(`Failed to parse ${page}: ${error}`);
          pages[page] = true;
        }
      }
    }
  }
}

/**
 * Cache a file to the .cache directory
 * @param page The URL of the page
 * @param content The content of the page
 */
function cacheFile(page: string, content: string) {
  const url = new URL(page);
  ensureDirSync(`.cache/${url.hostname}`);
  const fileName = `.cache/${url.hostname}/${
    url.pathname.replace(
      /\//g,
      "_",
    )
  }`;
  Deno.writeFile(fileName, new TextEncoder().encode(content));
}

/**
 * Global client to prevent creating a new client for each request
 */
let client: Deno.HttpClient | null = null;

function getClient() {
  if (client === null) {
    client = Deno.createHttpClient({
      proxy: { url: config.proxy ?? "" },
    });
  }
  return client;
}

/**
 * Parse a page and return the content and links. Will use a proxy if configured.
 * @throws Will throw an error if the page cannot be fetched or parsed by DOMParser.
 * @returns The content of the page as a string and an array of links that share the same hostname.
 */
export async function parsePage(
  url: string,
): Promise<{ content: string; links: (string | null)[] }> {
  const res = await fetch(url, { client: getClient() });
  if (res.status !== 200) {
    throw new Error(`Failed to fetch page: ${url}`);
  }
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (doc === null) {
    throw new Error(`Failed to parse page: ${url}`);
  }

  // Find all local links on the page, does not include subdomains
  const oUrl = new URL(url);
  const hostnameRegex = new RegExp(
    `^(http(s)?:\/\/)?(www\.)?${oUrl.hostname.replace(/\./g, "\\.")}`,
    "i",
  );

  const nodesSet = new Set<string>();
  Array.from(doc.querySelectorAll("[href]")).forEach((node) => {
    let href = (node as Element).getAttribute("href");
    if (href !== null) {
      // Resolve relative URLs
      href = new URL(href, url).href;
      if (hostnameRegex.test(href)) {
        nodesSet.add(href);
      }
    }
  });
  const nodes = Array.from(nodesSet);
  const content = doc.querySelector("body")?.textContent ?? "";

  // Return text of the document and the links
  return { content: content, links: nodes };
}
