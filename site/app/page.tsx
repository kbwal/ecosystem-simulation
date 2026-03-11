import Grid from "@/components/Grid";

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black font-sans">
            <Grid cellSize={4} />
            <a
                href="/submit"
                className="fixed bottom-6 right-6 rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-300 backdrop-blur-sm transition-colors hover:border-zinc-500 hover:text-white"
            >
                Submit your own animal!
            </a>
        </div>
    );
}
