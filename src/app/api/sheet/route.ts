import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { SHEET_ID, CREDENTIALS_PATH } from "@/config/sheet.config";

// Helper: Load credentials
function getCredentials() {
  const credPath = path.resolve(process.cwd(), CREDENTIALS_PATH);
  const content = fs.readFileSync(credPath, "utf8");
  return JSON.parse(content);
}

// Helper: Get Google Sheets client
async function getSheetsClient() {
  const credentials = getCredentials();
  const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes,
  });
  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

// GET: Read all rows from Sheet (range: Sheet1!A1:Z)
export async function GET() {
  try {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A1:Z",
    });
    return NextResponse.json({ data: res.data.values || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Append a row to Sheet (expects JSON body: { values: [...] })
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.values || !Array.isArray(body.values)) {
      return NextResponse.json({ error: "Missing 'values' array in body" }, { status: 400 });
    }
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A1:Z",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [body.values] },
    });
    return NextResponse.json({ result: res.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
