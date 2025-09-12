import { getStore } from "@netlify/blobs";

// Access the Netlify Blob store
const store = getStore({
  name: "rewards-config",
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_API_TOKEN,
});

export async function handler(event) {
  // Handle POST request to save the sheetId
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { sheetId } = body;

      if (!sheetId) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing sheetId" }) };
      }

      // Save the spreadsheet ID in the Blob store
      await store.set("spreadsheet_id", sheetId);

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  // Handle GET request to retrieve the sheetId
  if (event.httpMethod === "GET") {
    try {
      // Retrieve the blob entry
      const blob = await store.get("spreadsheet_id");

      // If no blob exists, return null
      if (!blob) {
        return { statusCode: 200, body: JSON.stringify({ sheetId: null }) };
      }
      
      // Get the text content from the blob object
      const sheetId = await blob.text();

      return { statusCode: 200, body: JSON.stringify({ sheetId }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
}
