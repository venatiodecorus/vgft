import { parse } from "https://deno.land/std@0.218.0/yaml/parse.ts";
import Joi from "npm:joi";

type Config = {
  sources: string[];
  proxy?: string;
};

export let config: Config;

// Config file schema
const schema = Joi.object<Config>({
  sources: Joi.array().items(Joi.string()).required(),
  proxy: Joi.string().uri().optional(),
});

// Parses the JSON config file and returns the parsed object
export async function readConfigFile() {
  // const decoder = new TextDecoder("utf-8");
  const data = await Deno.readTextFile("config.yaml");
  const parsedConfig = parse(data) as Config;
  // const parsedConfig = JSON.parse(decoder.decode(data));

  const { error } = schema.validate(parsedConfig);
  if (error) {
    console.error("Invalid config file");
    Deno.exit(1);
  }

  config = parsedConfig;
}
