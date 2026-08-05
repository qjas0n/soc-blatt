import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "LSPD SOC - Login",
    description: "Login zum Special Operations Command Dienstblatt",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return children;
}
