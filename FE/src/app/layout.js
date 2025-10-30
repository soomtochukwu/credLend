import "./globals.css";
import ToasterProvider from "../components/ToasterProvider";
import ClientLayout from "./ClientLayout"; // ✅ Import the new client wrapper

export const metadata = {
  title: "Credlend App",
  description: "Loan management application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* ✅ Move all client logic into a client component */}
        <ClientLayout>{children}</ClientLayout>
        <ToasterProvider />
      </body>
    </html>
  );
}
