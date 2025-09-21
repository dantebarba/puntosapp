import { getStore } from "@netlify/blobs";

const store = getStore({
  name: "rewards-config",
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_API_TOKEN,
});

export async function handler(event) {
  try {
    // Get the spreadsheet ID directly from the store
    const sheetId = await store.get("spreadsheet_id");
    if (!sheetId) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Spreadsheet ID not configured." }),
      };
    }
   // Sheet name for purchase points config (configurable)  
    const configuredSheetName = await store.get("points_sheet_name");  
    const sheetName = configuredSheetName || "Puntos";  
    const range = `${sheetName}!A:Z`;
    if (!process.env.GOOGLE_API_KEY) {  
      return {  
        statusCode: 500,  
        body: JSON.stringify({ error: "Missing GOOGLE_API_KEY" }),  
      };  
    }
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${process.env.GOOGLE_API_KEY}`;

    const response = await fetch(sheetsUrl);
    if (!response.ok) {
      const errorDetails = await response.json().catch(() => ({ message: "Could not parse error from Google Sheets API." }));
      return { statusCode: response.status, body: JSON.stringify({ error: "Failed to read sheet", details: errorDetails }) };
    }

    const data = await response.json();
    if (!data.values || data.values.length < 1) {
      return { statusCode: 404, body: JSON.stringify({ error: "No data found in points sheet." }) };
    }

    // The first row is the header, the rest are data rows
    const [headerRow, ...dataRows] = data.values;
    const validHeaders = [];
    headerRow.forEach((header, index) => {
      if (header && header.trim()) {
        validHeaders.push({
          key: header.trim().toLowerCase().replace(/ /g, '_'),
          index: index
        });
      }
    });
    const pointsConfig = dataRows.map(row => {
      const entry = {};
      validHeaders.forEach(headerInfo => {
        entry[headerInfo.key] = row[headerInfo.index] || null;
      });
      return entry;
    });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
      body: JSON.stringify(pointsConfig),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
