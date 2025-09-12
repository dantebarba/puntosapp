import { getStore } from "@netlify/blobs";

const store = getStore({
  name: "rewards-config",
  siteID: process.env.NETLIFY_SITE_ID,   // Your site's API ID
  token: process.env.NETLIFY_API_TOKEN, // Your personal access token
});

export async function handler(event) {
  try {
    const user = event.queryStringParameters?.user;
    if (!user) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing user param" }) };
    }

    // Get the spreadsheet ID blob from the store
    const blob = await store.get("spreadsheet_id");
    if (!blob) {
      return {
        statusCode: 404, // Use 404 Not Found since the config is missing
        body: JSON.stringify({ error: "Spreadsheet ID not configured." }),
      };
    }
    // Read the text content from the blob
    const sheetId = await blob.text();

    const range = "Sheet1!A:B"; // adjust as needed
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${process.env.GOOGLE_API_KEY}`;

    const response = await fetch(sheetsUrl);
    if (!response.ok) {
        const errorDetails = await response.json().catch(() => ({ message: "Could not parse error from Google Sheets API."}));
        return { statusCode: response.status, body: JSON.stringify({ error: "Failed to read sheet", details: errorDetails }) };
    }

    const data = await response.json();

    // It's possible for an empty sheet to have no values
    if (!data.values) {
        return { statusCode: 200, body: JSON.stringify({ user, points: null }) };
    }

    // Find the row for this user
    const row = data.values.find(r => r[0] === user);

    return {
      statusCode: 200,
      body: JSON.stringify({ user, points: row ? row[1] : null }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
