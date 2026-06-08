import "./globals.css";

export const metadata = {
  title: "MEYO Startup",
  description: "Project Management System",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}