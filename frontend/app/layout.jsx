import "./globals.css";

export const metadata = {
  title: "Outmate Mini Enrichment",
  description: "Mini GTM enrichment system take-home",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
