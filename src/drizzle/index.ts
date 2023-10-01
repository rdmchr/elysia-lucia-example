import postgres from "postgres";
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export const queryClient = postgres(process.env.DB_URL!);
export const db: PostgresJsDatabase = drizzle(queryClient);
