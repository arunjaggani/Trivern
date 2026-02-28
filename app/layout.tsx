import type { Metadata } from 'next';
import { Manrope, Fraunces } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});

const fraunces = Fraunces({
    subsets: ['latin'],
    variable: '--font-serif',
    display: 'swap',
    weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
    title: 'Trivern — Systems-first web + AI installs',
    description:
        'We install growth-ready websites with built-in AI & automation. Capture intent, qualify context, and follow up automatically.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
            <body className={`${manrope.className} min-h-screen overflow-x-hidden`}>
                {children}
            </body>
        </html>
    );
}
