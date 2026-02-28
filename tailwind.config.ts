import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background) / <alpha-value>)',
                foreground: 'hsl(var(--foreground) / <alpha-value>)',
                card: 'hsl(var(--card) / <alpha-value>)',
                'card-foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
                'card-border': 'hsl(var(--card-border) / <alpha-value>)',
                muted: 'hsl(var(--muted) / <alpha-value>)',
                'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
                accent: 'hsl(var(--accent) / <alpha-value>)',
                'accent-foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',
                primary: 'hsl(var(--primary) / <alpha-value>)',
                'primary-foreground': 'hsl(var(--primary-foreground) / <alpha-value>)',
                'primary-border': 'hsl(var(--primary-border) / <alpha-value>)',
                secondary: 'hsl(var(--secondary) / <alpha-value>)',
                'secondary-foreground': 'hsl(var(--secondary-foreground) / <alpha-value>)',
                border: 'hsl(var(--border) / <alpha-value>)',
                input: 'hsl(var(--input) / <alpha-value>)',
                ring: 'hsl(var(--ring) / <alpha-value>)',
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'Manrope', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
                serif: ['var(--font-serif)', 'Fraunces', 'ui-serif', 'Georgia', 'serif'],
                display: ['var(--font-serif)', 'Fraunces', 'ui-serif', 'Georgia', 'serif'],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
        },
    },
    plugins: [],
};

export default config;
