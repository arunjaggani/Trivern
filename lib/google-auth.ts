import { google } from "googleapis";

// Shared Google Auth helper — uses service account credentials from .env.local
export function getGoogleAuth() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        },
        scopes: [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/spreadsheets",
        ],
    });
    return auth;
}

export function getCalendarClient() {
    const auth = getGoogleAuth();
    return google.calendar({ version: "v3", auth });
}

// The calendar ID to use — defaults to primary but can be set via env
export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
