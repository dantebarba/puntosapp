import { getStore } from "@netlify/blobs";

// Access the Netlify Blob store
const store = getStore({
  name: "rewards-config",
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_API_TOKEN,
});

export async function handler(event) {
  // Log every request to see what's happening
  console.log(`--- Admin function invoked at ${new Date().toISOString()} ---`);
  console.log("HTTP Method:", event.httpMethod);

  // Handle POST request (unchanged)
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { sheetId } = body;
      if (!sheetId) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing sheetId" }) };
      }
      await store.set("spreadsheet_id", sheetId);
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (err) {
      console.error("!!! ERROR IN POST HANDLER !!!", err);
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  // Handle GET request
  if (event.httpMethod === "GET") {
    console.log("Handling GET request...");
    try {
      console.log("Attempting to get 'spreadsheet_id' from blob store...");
      const sheetId = await store.get("spreadsheet_id");
      console.log("Successfully retrieved value from store:", sheetId);

      return {
        statusCode: 200,
        body: JSON.stringify({ sheetId: sheetId || null }),
      };
    } catch (err) {
      // THIS IS THE MOST IMPORTANT PART: We explicitly log the crash
      console.error("!!! CAUGHT AN ERROR IN GET HANDLER !!!");
      console.error(err);

      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
}