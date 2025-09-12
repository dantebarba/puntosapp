import { getStore } from "@netlify/blobs";

export async function handler(event) {
  const store = getStore("rewards-config");

  if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body || "{}");
    const sheetId = body.sheetId;

    if (!sheetId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing sheetId" }) };
    }

    await store.set("spreadsheet_id", sheetId);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  if (event.httpMethod === "GET") {
    const sheetId = await store.get("spreadsheet_id");
    return { statusCode: 200, body: JSON.stringify({ sheetId }) };
  }

  return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
}