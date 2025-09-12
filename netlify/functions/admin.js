import { getStore } from "@netlify/blobs";

// Access the Netlify KV store
const store = getStore({
  name: "rewards-config",
  siteID: process.env.NETLIFY_SITE_ID,   // Your site's API ID
  token: process.env.NETLIFY_API_TOKEN, // Your personal access token
});

export async function handler(event) {
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const sheetId = body.sheetId;

      if (!sheetId) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing sheetId" }) };
      }

      // Save the spreadsheet ID in the KV store
      await store.set("spreadsheet_id", sheetId);

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  if (event.httpMethod === "GET") {
    try {
      const sheetId = await store.get("spreadsheet_id");
      return { statusCode: 200, body: JSON.stringify({ sheetId }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
}
