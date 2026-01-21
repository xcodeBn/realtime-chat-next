"use client"

import {useParams} from "next/navigation";
import {useEffect, useState} from "react";

function formatTimeRemaining(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const Page = () => {
    const params = useParams();
    const roomId = params.roomId as string;
    const [copyStatus, setCopyStatus] = useState<"copy" | "copied!">("copy");
    const [timeRemaining, setTimeRemaining] = useState<number | null>(2423);


    const  copyLink = () => {
        const url  = window.location.href;
        navigator.clipboard.writeText(url)

        setCopyStatus("copied!")
        setTimeout(() => {setCopyStatus("copy")}, 2000);
    }
    return (<main className={"flex flex-col h-screen max-h-screen overflow-hidden"}>
            <header className={"border-b border-zinc-800 p-4 flex items-center justify-between bg-zinc-900/30"}>
                <div className={"flex items-center gap-4"}>
                    <div className={"flex flex-col"}>
                        <span className={"text-xs text-zinc-500 uppercase"}>
                            Room ID
                        </span>
                        <div className={"flex items-center gap-2"}>
                            <span className={"font-bold text-green-500"}>
                                {roomId}
                            </span>
                            <button onClick={()=>{
                                copyLink()
                            }
                            } className={"text=[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 transition-colors"}>

                                {copyStatus}
                            </button>
                        </div>
                    </div>

                    <div className={"h-8 w-px bg-zinc-800"}/>

                    <div className={"flex flex-col"}>
                            <span className={"text-xs text-zinc-500 uppercase"}>
                                Self Destruct
                            </span>
                        <span className={`text-sm font-bold flex items-center gap-2${timeRemaining !== null && timeRemaining <= 60 ? " text-red-500" : " text-zinc-200"}`}>
                            {timeRemaining !== null ? `${formatTimeRemaining(timeRemaining)}` : "--:--"}
                        </span>
                    </div>
                </div>
                <button className={"text-xs bg-zinc-800 hover:bg-red-600 px-3 py-1.5 rounded text-zinc-400 hover:text-white font-bold transition-all group flex items-center gap-2 disabled:opacity-50"}>
                    <span className={"group=hover:animate-pulse"}>
                        💣
                    </span>
                    DESTROY NOW
                </button>
            </header>
        </main>

    )
}
export default Page
