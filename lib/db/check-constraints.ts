import { db } from "./index";
import { sql } from "drizzle-orm";

async function checkConstraints() {
  try {
    const result = await db.execute(sql`
      SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'session'
    `);
    console.log("Session table constraints:");
    console.table(result);
  } catch (error) {
    console.error("Error:", error);
  }
  
  process.exit(0);
}

checkConstraints();
