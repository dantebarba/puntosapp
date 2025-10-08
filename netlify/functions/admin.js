import { getStore } from "@netlify/blobs";

// Access the Netlify Blob store
const store = getStore({
  name: "rewards-config",
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_API_TOKEN,
});

export async function handler(event, context) {
  // Log every request to see what's happening
  console.log(`--- Admin function invoked at ${new Date().toISOString()} ---`);
  console.log("HTTP Method:", event.httpMethod);

  // Handle POST request (unchanged)
  if (event.httpMethod === "POST") {
    const user = context?.clientContext?.user;
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    const roles = user.app_metadata?.roles || [];
    if (!roles.includes("admin")) {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }
    try {
      const body = JSON.parse(event.body || "{}");
      const { sheetId, scoresSheetName, rewardsSheetName, pointsSheetName } = body;
      if (!sheetId) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing sheetId" }) };
      }
      await store.set("spreadsheet_id", sheetId);
      if (scoresSheetName) {
        await store.set("scores_sheet_name", scoresSheetName);
      }
      if (rewardsSheetName) {
        await store.set("rewards_sheet_name", rewardsSheetName);
      }
      if (pointsSheetName) {
        await store.set("points_sheet_name", pointsSheetName);
      }
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
      const scoresSheetName = await store.get("scores_sheet_name");
      const rewardsSheetName = await store.get("rewards_sheet_name");
      const pointsSheetName = await store.get("points_sheet_name");
      console.log("Successfully retrieved value from store:", sheetId, scoresSheetName, rewardsSheetName, pointsSheetName);
      return {
        statusCode: 200,
        body: JSON.stringify({ sheetId: sheetId || null, scoresSheetName: scoresSheetName || null, rewardsSheetName: rewardsSheetName || null, pointsSheetName: pointsSheetName || null }),
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