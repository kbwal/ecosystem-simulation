import Button from "@/components/Button";
import Grid from "@/components/Grid";

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <Grid cellSize={5} />
            {/* <Button /> */}
        </div>
    );
}
