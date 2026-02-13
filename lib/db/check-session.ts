import { db } from "./index";
import { sql } from "drizzle-orm";

async function checkSessionTable() {
  try {
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'session'
    `);
    console.log("Session table columns:");
    console.table(result);
  } catch (error) {
    console.error("Error:", error);
  }
  
  process.exit(0);
}

checkSessionTable();
