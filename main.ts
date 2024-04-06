import { readConfigFile } from "./config.ts";
import { startServer } from "./router.ts";
import { parseArgs } from "https://deno.land/std@0.207.0/cli/parse_args.ts";
import { parseSources } from "./parser.ts";
import { packCache } from "./packer.ts";

const flags = parseArgs(Deno.args, {
  boolean: ["run", "serve", "pack"],
  alias: { r: "run", s: "serve", p: "pack" },
});

await readConfigFile();

if (flags.run) {
  await parseSources();
} else if (flags.pack) {
  packCache();
} else if (flags.serve) {
  startServer();
}
