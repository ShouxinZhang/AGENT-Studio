import Link from "next/link";

export default function SqlPage() {
    return (
        <div className="min-h-screen w-full bg-background text-foreground">
            <header className="h-12 border-b border-border flex items-center px-4 bg-card">
                <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Back to Chat
                </Link>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-semibold">SQL Studio</h1>
                <p className="mt-2 text-sm text-muted-foreground">Coming soon.</p>
            </main>
        </div>
    );
}
