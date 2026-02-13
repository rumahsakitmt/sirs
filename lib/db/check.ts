import { db } from "./index";
import { sql } from "drizzle-orm";

async function checkTables() {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Existing tables:", result);
    return result.length > 0;
  } catch (error) {
    console.error("Error checking tables:", error);
    return false;
  }
}

checkTables().then(hasTables => {
  console.log("Has tables:", hasTables);
  process.exit(0);
});
