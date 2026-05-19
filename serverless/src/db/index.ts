import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import * as schema from "./schema";

export const createDb = (databaseUrl: string) => {
  const client = neon(databaseUrl);
  return drizzle(client, { schema });
};

export type DB = ReturnType<typeof createDb>;
export { schema };
