import "./globals.css";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html className="dark h-full" lang="en">
            <body className="dark:bg-zinc-800 dark:text-zinc-100 h-full">
                {children}
            </body>
        </html>
    );
}
