import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Pages employees CAN access
const employeeAllowed = [
    "/dashboard",          // Overview
    "/dashboard/employee", // Employee dashboard
    "/dashboard/crm",      // All CRM pages (conversations, leads, bookings, contacts, analytics)
];

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const pathname = req.nextUrl.pathname;

        // Employee role-gating: block admin-only pages
        if (token?.role === "EMPLOYEE" && pathname.startsWith("/dashboard")) {
            const isAllowed = employeeAllowed.some(
                (path) => pathname === path || pathname.startsWith(path + "/")
            );
            if (!isAllowed) {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*"],
};
