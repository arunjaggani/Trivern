import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: NextRequest) {
    // Parse body — return 200 immediately regardless of Sheets outcome
    let body: Record<string, string>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { name, company, email, phone, website, service, context } = body;

    // Fire-and-forget: append to Google Sheets in the background
    // We don't await this — the response has already been sent
    const sheetsWrite = (async () => {
        try {
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
                },
                scopes: ["https://www.googleapis.com/auth/spreadsheets"],
            });

            const sheets = google.sheets({ version: "v4", auth });
            const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

            if (!spreadsheetId) {
                throw new Error("Missing GOOGLE_SHEETS_SPREADSHEET_ID");
            }

            const timestamp = new Date().toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                dateStyle: "medium",
                timeStyle: "short",
            });

            const rowData = [
                timestamp,
                name || "",
                company || "",
                email || "",
                phone || "",
                website || "",
                service || "",
                context || "",
                "Website Lead Form",
                "New",
            ];

            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: "Sheet1!A:J",
                valueInputOption: "RAW",
                requestBody: {
                    values: [rowData],
                },
            });

            console.log("[/api/lead] ✅ Row appended to Google Sheets");
        } catch (err) {
            console.error("[/api/lead] ❌ Google Sheets write failed:", err);
            // Fail silently — Sheets is backup storage only
        }
    })();

    // In Next.js 14 there's no native waitUntil, but we can still
    // kick off the promise. The serverless function stays alive long
    // enough for this to complete in most environments.
    // We intentionally do NOT await — respond immediately.
    void sheetsWrite;

    return NextResponse.json({ success: true });
}
