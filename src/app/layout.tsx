import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ForcePasswordChange from "@/components/ForcePasswordChange";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "LSPD - Special Operations Command",
  description: "Dienstblatt des Special Operations Command des Los Santos Police Department",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const hasSession = !!session;
  const requiresPasswordChange = session?.requiresPasswordChange;

  return (
    <html lang="de">
      <body style={{ margin: 0, minHeight: '100vh' }}>
        {hasSession ? (
          <div className="app-container">
            {requiresPasswordChange && <ForcePasswordChange />}
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        ) : (
          // Login page: no sidebar, centered layout
          <div style={{
            minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.08) 0%, transparent 50%), linear-gradient(180deg, #070a12 0%, #0d1117 40%, #111827 100%)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: '20%', left: '10%',
              width: '400px', height: '400px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(239,68,68,0.04) 0%, transparent 60%)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute', bottom: '10%', right: '15%',
              width: '300px', height: '300px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(234,179,8,0.03) 0%, transparent 60%)',
              pointerEvents: 'none'
            }} />
            {children}
          </div>
        )}
      </body>
    </html>
  );
}
