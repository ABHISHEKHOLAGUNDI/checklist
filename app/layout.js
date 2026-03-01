import "./globals.css";

export const metadata = {
  title: "Ultimate Web CRM",
  description: "Track leads generated from Google Maps",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
