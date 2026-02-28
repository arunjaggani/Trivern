import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ThemeProvider from '@/components/ThemeProvider';
import ZaraChat from '@/components/ZaraChat';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="trivern-site-theme">
      <div className="relative min-h-screen overflow-x-hidden">
        {/* Top surface noise + gridlines */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10">
          <div className="surface noise h-[520px] w-full" />
          <div className="absolute inset-0 gridlines" />
        </div>

        <Navigation />
        <main className="relative">{children}</main>
        <Footer />
        <ZaraChat />
      </div>
    </ThemeProvider>
  );
}
