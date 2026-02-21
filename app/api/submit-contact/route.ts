import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, company, email, phone, website, selectedOption, context } = body;

        // Validation
        if (!context || context.trim().length < 80) {
            return NextResponse.json(
                { error: "Context must be at least 80 characters" },
                { status: 400 }
            );
        }

        if (!email && !phone) {
            return NextResponse.json(
                { error: "Either email or phone is required" },
                { status: 400 }
            );
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: "Please enter a valid email address" },
                { status: 400 }
            );
        }

        // Google Sheets setup
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

        // Format timestamp in IST
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
            selectedOption || "",
            context || "",
            "Website Contact Form",
            "New",
        ];

        // Append to Google Sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "Sheet1!A:J",
            valueInputOption: "RAW",
            requestBody: {
                values: [rowData],
            },
        });

        return NextResponse.json({
            success: true,
            message: "Contact form submitted successfully",
        });
    } catch (error: any) {
        console.error("Error submitting contact form:", error);

        return NextResponse.json(
            {
                error: "Failed to submit form. Please try again.",
                details: process.env.NODE_ENV === "development" ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
