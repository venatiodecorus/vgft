/*
 * This function is responsible for packing the cache into a file OpenAI will accept
 */
export function packCache() {
  // Read the cache directory
  const cacheDir = Deno.readDirSync(".cache");
  const cache: { [key: string]: string } = {};
  for (const dirEntry of cacheDir) {
    if (dirEntry.isDirectory) {
      const files = Deno.readDirSync(`.cache/${dirEntry.name}`);
      for (const file of files) {
        const content = Deno.readTextFileSync(
          `.cache/${dirEntry.name}/${file.name}`,
        );
        cache[`${dirEntry.name}/${file.name}`] = content;
      }
    }
  }

  // Write the cache to a file
  Deno.writeTextFileSync("cache.json", JSON.stringify(cache));
}
