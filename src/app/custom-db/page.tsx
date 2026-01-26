"use client"
import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";

export default function CustomDbPage() {
    const router = useRouter();
    const [url, setUrl] = useState("");
    const [token, setToken] = useState("");

    useEffect(() => {
        const storedUrl = localStorage.getItem("custom_redis_url");
        const storedToken = localStorage.getItem("custom_redis_token");
        if (storedUrl) setUrl(storedUrl);
        if (storedToken) setToken(storedToken);
    }, []);

    const handleSave = () => {
        if (url && token) {
            localStorage.setItem("custom_redis_url", url);
            localStorage.setItem("custom_redis_token", token);
            alert("Custom Database Saved!");
            router.push("/");
        } else {
            alert("Please provide both URL and Token");
        }
    };

    const handleClear = () => {
        localStorage.removeItem("custom_redis_url");
        localStorage.removeItem("custom_redis_token");
        setUrl("");
        setToken("");
        alert("Reset to Default Database");
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-green-500">
                        {">"}custom database
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        Connect to your own Upstash Redis instance.
                    </p>
                </div>

                <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md space-y-4">
                    <div className="space-y-2">
                        <label className="text-zinc-500 text-xs uppercase">Redis REST URL</label>
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-black border border-zinc-800 focus:border-green-900 focus:outline-none text-zinc-100 p-3 text-sm font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-zinc-500 text-xs uppercase">Redis REST Token</label>
                        <input
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Ax..."
                            type="password"
                            className="w-full bg-black border border-zinc-800 focus:border-green-900 focus:outline-none text-zinc-100 p-3 text-sm font-mono"
                        />
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-zinc-100 text-black p-3 text-sm font-bold hover:bg-zinc-50 transition-colors"
                        >
                            SAVE CONFIG
                        </button>
                        <button
                            onClick={handleClear}
                            className="px-4 border border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-900 transition-colors"
                        >
                            RESET
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => router.push("/")}
                        className="w-full text-zinc-600 text-xs hover:text-zinc-400 mt-2"
                    >
                        &larr; Back to Home
                    </button>
                </div>
            </div>
        </main>
    );
}
