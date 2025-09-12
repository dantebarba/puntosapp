import { getStore } from "@netlify/blobs";

const store = getStore({
  name: "rewards-config",
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_API_TOKEN,
});

export async function handler(event) {
  try {
    // 1. Get the user ID from the query parameters
    const userId = event.queryStringParameters?.userid;
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing userid query parameter." }) };
    }

    // Get the spreadsheet ID directly from the store
    const sheetId = await store.get("spreadsheet_id");
    if (!sheetId) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Spreadsheet ID not configured." }),
      };
    }
    // No .text() call is necessary with this configuration

    // Expanded range to cover columns A through Z
    const range = "Sheet1!A:Z"; 
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${process.env.GOOGLE_API_KEY}`;

    const response = await fetch(sheetsUrl);
    if (!response.ok) {
      const errorDetails = await response.json().catch(() => ({ message: "Could not parse error from Google Sheets API." }));
      return { statusCode: response.status, body: JSON.stringify({ error: "Failed to read sheet", details: errorDetails }) };
    }

    const data = await response.json();

    // Return an error if the sheet has no data
    if (!data.values || data.values.length < 1) {
      return { statusCode: 404, body: JSON.stringify({ error: "No data found in spreadsheet." }) };
    }

    // The first row is the header, the rest are data rows
    const [headerRow, ...dataRows] = data.values;

    // Identify valid headers and their original column index
    const validHeaders = [];
    headerRow.forEach((header, index) => {
      if (header && header.trim()) {
        validHeaders.push({
          key: header.trim().toLowerCase().replace(/ /g, '_'),
          index: index
        });
      }
    });

    // Map all data rows to JSON objects using the valid headers
    const allUsers = dataRows.map(row => {
      const entry = {};
      validHeaders.forEach(headerInfo => {
        entry[headerInfo.key] = row[headerInfo.index] || null;
      });
      return entry;
    });

    // 2. Find the specific user's row in the processed data
    const userRecord = allUsers.find(row => row.userid === userId);

    // 3. Return the result
    if (userRecord) {
      return {
        statusCode: 200,
        body: JSON.stringify(userRecord),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `User with ID '${userId}' not found.` }),
      };
    }

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
