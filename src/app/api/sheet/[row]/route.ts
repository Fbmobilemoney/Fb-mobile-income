import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { SHEET_ID, CREDENTIALS_PATH } from "@/config/sheet.config";

function getCredentials() {
  if (process.env.GOOGLE_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS);
  }
  const credPath = path.resolve(process.cwd(), CREDENTIALS_PATH);
  const content = fs.readFileSync(credPath, "utf8");
  return JSON.parse(content);
}

async function getSheetsClient() {
  const credentials = getCredentials();
  const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
  const auth = new google.auth.GoogleAuth({ credentials, scopes });
  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

// PUT: update row (row index starts from 1, 1=first row)
export async function PUT(req: NextRequest, { params }: { params: { row: string } }) {
  try {
    const rowIndex = parseInt(params.row, 10);
    if (!rowIndex || rowIndex < 1) {
      return NextResponse.json({ error: "Invalid row index" }, { status: 400 });
    }
    const body = await req.json();
    if (!body.values || !Array.isArray(body.values)) {
      return NextResponse.json({ error: "Missing 'values' array in body" }, { status: 400 });
    }
    const sheets = await getSheetsClient();
    const range = `Sheet1!A${rowIndex}:Z${rowIndex}`;
    const res = await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [body.values] },
    });
    return NextResponse.json({ result: res.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: clear row (row index starts from 1)
export async function DELETE(req: NextRequest, { params }: { params: { row: string } }) {
  try {
    const rowIndex = parseInt(params.row, 10);
    if (!rowIndex || rowIndex < 1) {
      return NextResponse.json({ error: "Invalid row index" }, { status: 400 });
    }
    const sheets = await getSheetsClient();
    const range = `Sheet1!A${rowIndex}:Z${rowIndex}`;
    const res = await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range,
    });
    return NextResponse.json({ result: res.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
