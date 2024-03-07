/// <reference types="npm:@types/node" />
import * as cheerio from "npm:cheerio"; // alt option, jsdom?
/// <reference types="npm:@types/crawler" />
import * as crawler from "npm:crawler";
import { config } from "./config.ts";
import { ensureDirSync } from "https://deno.land/std@0.218.2/fs/ensure_dir.ts";

let client: Deno.HttpClient | null = null;

function getClient() {
  if (client === null) {
    client = Deno.createHttpClient({
      proxy: { url: config.proxy ?? "" },
    });
  }
  return client;
}

export function getPage(url: string): Promise<string> {
  return fetch(url, { client: getClient() }).then((response) => {
    return response.text();
  });
}

export function parsePage(html: string, pages: Map<string, boolean>) {
  const $ = cheerio.load(html);
  const links = $("a")
    .map((i, el) => $(el).attr("href"))
    .get();

  // Filter links and populate array
  const localLinks = links.filter((link) => {
    return link.startsWith("/wiki/");
  });

  // Add links to pages Map
  localLinks.forEach((link) => {
    if (!pages.has(link)) {
      pages.set(link, false);
    }
  });
}

/**
 * This function will parse all the sources listed in the config and cache them
 */
export async function parseSources() {
  for (const source of config.sources) {
    console.log(`Parsing ${source}`);
    // Create a folder in .cache for each source
    let url = new URL(source);
    ensureDirSync(`.cache/${url.hostname}`);

    let pages = new Map<string, boolean>();
    // Add the source to the pages Map
    pages.set(url.pathname, false);
    // Iterate through all found pages and parse them for links and save them
    while (Array.from(pages.values()).includes(false)) {
      for (let [page, visited] of pages) {
        if (visited) {
          continue;
        }
        console.log(`Parsing ${page}`);
        pages.set(page, true);
        const html = await getPage(`https://${url.hostname}${page}`);
        const pageUrl = new URL(`https://${url.hostname}${page}`);
        const fileName = `.cache/${url.hostname}/${
          pageUrl.pathname?.replace(/\//g, "_")
        }`;
        Deno.writeFileSync(fileName, new TextEncoder().encode(html));
        parsePage(html, pages);
        // getPage(page).then((html) => {
        //   const pageUrl = new URL(page);
        //   const fileName = `.cache/${url.hostname}/${
        //     pageUrl.pathname?.replace(
        //       /\//g,
        //       "_",
        //     )
        //   }`;
        //   Deno.writeFileSync(
        //     `${fileName}`,
        //     new TextEncoder().encode(html),
        //   );
        //   parsePage(html, pages);
        // });
      }
    }
  } //});
}
