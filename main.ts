import { readConfigFile } from "./config.ts";
import { startServer } from "./router.ts";

await readConfigFile();
startServer();
