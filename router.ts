import { Application, Router } from "https://deno.land/x/oak@14.2.0/mod.ts";
import { parseSources } from "./parser.ts";

const router = new Router();

/**
 * Parse all sources. Returns 200 if successful, 500 if failed.
 */
router.get("/parse", async (context) => {
  try {
    await parseSources();
    context.response.status = 200;
  } catch (error) {
    context.response.body = `Failed to parse sources: ${error}`;
    context.response.status = 500;
  }
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

export async function startServer() {
  await app.listen({ port: 8000 });
}
