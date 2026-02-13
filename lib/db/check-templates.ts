import { db } from "./index";
import { reportTemplate } from "./schema";

async function checkTemplates() {
  try {
    const templates = await db.select().from(reportTemplate);
    console.log("Templates found:", templates.length);
    templates.forEach((t, i) => {
      console.log(`\n--- Template ${i + 1} ---`);
      console.log("ID:", t.id);
      console.log("Name:", t.name);
      console.log("Schema type:", typeof t.schema);
      console.log("Schema:", JSON.stringify(t.schema, null, 2).substring(0, 200) + "...");
    });
  } catch (error) {
    console.error("Error:", error);
  }
  
  process.exit(0);
}

checkTemplates();
