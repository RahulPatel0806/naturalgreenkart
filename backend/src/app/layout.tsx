/** Minimal root layout. This is an API-first app; the root page is informational. */
export const metadata = {
  title: 'Natural greenkart API',
  description: 'Natural greenkart grocery delivery platform API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
