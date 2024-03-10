import { fail } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { parsePage } from "./parser.ts";

Deno.test({
  name: "parsePage should not throw an error",
  permissions: { net: true },
  fn: async () => {
    try {
      await parsePage("https://google.com");
    } catch (error) {
      fail(`parsePage should not throw an error, but it threw ${error}`);
    }
  },
});
