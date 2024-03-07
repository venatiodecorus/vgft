import { Application, Router } from "https://deno.land/x/oak@14.2.0/mod.ts";
import { parseSources } from "./parser.ts";

const router = new Router();

// Kick off the parsing process
router.get("/parse", (context) => {
  parseSources();
  context.response.body = "Hello, world!";
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

export async function startServer() {
  await app.listen({ port: 8000 });
}
