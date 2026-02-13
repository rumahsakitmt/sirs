import { db } from "./index";
import { sql } from "drizzle-orm";

async function testConnection() {
  try {
    // Test simple query
    const result = await db.execute(sql`SELECT NOW()`);
    console.log("Connection successful:", result);
    
    // Test session table query
    const sessionResult = await db.execute(sql`
      SELECT * FROM session LIMIT 1
    `);
    console.log("Session query successful:", sessionResult);
  } catch (error) {
    console.error("Connection failed:", error);
  }
  
  process.exit(0);
}

testConnection();
