"use client"
import {useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";
import {client} from "@/lib/client";

export default function LoginPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const {mutate: login, isPending} = useMutation({
        mutationFn: async () => {
            await client.api.room.verify.post({
                roomId,
                password
            });
        },
        onSuccess: () => {
            // If verification succeeds, we need to "join" the room.
            // Since the proxy handles joining automatically for non-password rooms,
            // we need a way to tell the proxy "I verified the password, let me in".
            // However, the current proxy logic redirects to login if not connected.
            
            // A simple trick: We can't easily modify the proxy's "connected" list from here directly 
            // without a dedicated "join" endpoint that sets the cookie.
            // Let's rely on a secondary "join" action.
            
            // Wait! The proxy checks for 'x-auth-token'. 
            // We need an endpoint that, upon successful password verification, 
            // sets the 'x-auth-token' cookie and adds it to Redis 'connected' list.
            
            // Currently /verify just checks. We need it to also Log us In.
            // I will update the plan to make /verify also perform the "Join" logic.
             window.location.href = `/room/${roomId}`;
        },
        onError: () => {
            setError("Invalid password");
        }
    })

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
             <div className="w-full max-w-md space-y-8">
                 <div className="text-center space-y-2">
                      <h1 className="text-2xl font-bold tracking-tight text-green-500">
                          {">"}locked room
                      </h1>
                      <p className="text-zinc-500 text-sm">
                          enter password to access
                      </p>
                  </div>
                 
                 <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md space-y-4">
                     {error && (
                         <div className="bg-red-950/50 border border-red-900 p-2 text-center text-red-500 text-sm">
                             {error}
                         </div>
                     )}
                     <div className="space-y-2">
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full bg-black border border-zinc-800 focus:border-green-900 focus:outline-none text-zinc-100 p-3 text-sm"
                        />
                     </div>
                     <button 
                        onClick={() => login()}
                        disabled={isPending || !password}
                        className="w-full bg-zinc-100 text-black p-3 text-sm font-bold hover:bg-zinc-50 transition-colors disabled:opacity-50"
                     >
                         {isPending ? "UNLOCKING..." : "ENTER ROOM"}
                     </button>
                 </div>
             </div>
        </main>
    )
}
