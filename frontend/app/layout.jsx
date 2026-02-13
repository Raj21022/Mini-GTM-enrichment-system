import "./globals.css";

import { QueryProvider } from "../providers/query-provider";

export const metadata = {
  title: "Outmate Mini Enrichment",
  description: "Mini GTM enrichment system take-home",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
