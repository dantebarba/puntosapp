import { getStore } from "@netlify/blobs";

const store = getStore("rewards-config");

export async function handler(event) {
  const user = event.queryStringParameters?.user;
  if (!user) return { statusCode: 400, body: JSON.stringify({ error: "Missing user param" }) };

  const sheetId = await store.get("spreadsheet_id");
  if (!sheetId) return { statusCode: 500, body: JSON.stringify({ error: "Spreadsheet ID not set" }) };

  const range = "Sheet1!A:B";
  const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${process.env.GOOGLE_API_KEY}`;

  const data = await fetch(sheetsUrl).then(r => r.json());
  if (!data.values) return { statusCode: 500, body: JSON.stringify({ error: "Failed to read sheet" }) };

  const row = data.values.find(r => r[0] === user);
  return { statusCode: 200, body: JSON.stringify({ user, points: row ? row[1] : null }) };
}
