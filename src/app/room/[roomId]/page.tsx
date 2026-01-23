"use client"

import {useParams, useRouter} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {client} from "@/lib/client";
import {useUsername} from "@/hooks/use-username";
import { format } from "date-fns";
import {useRealtime} from "@/lib/realtime_client";
import { encrypt } from "@/lib/crypto";
import { DecryptedMessage } from "@/components/decrypted-message";

function formatTimeRemaining(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const Page = () => {
    const params = useParams();
    const roomId = params.roomId as string;
    const [copyStatus, setCopyStatus] = useState<"copy" | "copied!">("copy");
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [input,setInput] = useState("");
    const [secretKey, setSecretKey] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const {username} = useUsername()
    const router = useRouter()
    const queryClient = useQueryClient();

    useEffect(() => {
        // Extract key from URL hash
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
            setSecretKey(hash.slice(1));
        }
    }, []);

    const {data:ttlData} = useQuery({
        queryKey: ["ttl",roomId],
        queryFn: async () => {
            const res = await client.api.room.ttl.get({query: {roomId}});
            return res.data;
        }
    })
    const { data: messages,refetch} = useQuery({
        queryKey:["messages", roomId],
        queryFn: async () => {
            const room = await client.api.messages.get({query: {roomId}});
            return room.data;

        }})

      useRealtime(
        {
            channels: [roomId],
            events: ["chat.message","chat.destroy"],
            onData: ({event}) =>{
                if(event === "chat.message"){
                    refetch()
                }

                if(event === "chat.destroy"){
                    router.push("/?destroyed=true")
                }
            }
        }
    )


    const {mutate: destroyRoom} = useMutation({
        mutationFn: async () => {
            await client.api.room.delete(null,{query: {roomId}});
        }
    })

    useEffect( () => {
        if(ttlData?.ttl !== undefined){
            setTimeRemaining(ttlData.ttl);
        }
    }, [ttlData]);

    useEffect(() => {
        if(timeRemaining===null || timeRemaining <0) return
        if(timeRemaining===0){
            router.push("/?destroyed=true")
            return
        }
        const interval  = setInterval(() => {
            setTimeRemaining((prev) => {
                if(prev === null || prev<=1)
                {
                    clearInterval(interval)
                    return 0;
                }
                return prev - 1
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timeRemaining,router]);


    const {mutate: sendMessage,isPending} = useMutation({
        mutationFn: async ({text}:{
            text: string
        }) => {
            let content = text;
            if (secretKey) {
                content = await encrypt(text, secretKey);
            }
            await client.api.messages.post({
                sender: username, text: content
            }, {query: {roomId}})
        },
        onMutate: async ({text}) => {
             await queryClient.cancelQueries({ queryKey: ["messages", roomId] });
             const previousMessages = queryClient.getQueryData(["messages", roomId]);
             
             let content = text;
             if (secretKey) {
                content = await encrypt(text, secretKey);
             }

             queryClient.setQueryData(["messages", roomId], (old: any) => {
                 const newMessage = {
                     id: Math.random().toString(), // Temp ID
                     sender: username,
                     text: content,
                     timeStamp: Date.now(),
                     roomId: roomId,
                     token: "optimistic" // specific marker if needed
                 };
                 
                 return {
                     ...old,
                     messages: [...(old?.messages || []), newMessage]
                 };
             });
             
             return { previousMessages };
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(["messages", roomId], context?.previousMessages);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
        }
    })
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
                <button onClick={()=>{
                    destroyRoom()
                }} className={"text-xs bg-zinc-800 hover:bg-red-600 px-3 py-1.5 rounded text-zinc-400 hover:text-white font-bold transition-all group flex items-center gap-2 disabled:opacity-50"}>
                    <span className={"group-hover:animate-pulse"}>
                        💣
                    </span>
                    DESTROY NOW
                </button>
            </header>
            
            <div className={"flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin flex flex-col"}>
                 {/* No Messages */}
                {messages?.messages.length === 0 && (
                    <div className={"flex items-center justify-center flex-1"}>
                        <p className={"text-zinc-600 text-sm font-mono"}>No messages yet. Start the conversation!</p>
                    </div>
                )}

                {messages?.messages.map((msg)=>{
                    return <div key={msg.id} className={"flex flex-col items-start"}>
                        <div className={"max-w-[80%] group "}>
                            <div className={"flex items-baseline gap-3 mb-1"}>
                                <span className={
                                    `text-xs font-bold pl-2 ${msg.sender===username ? "text-green-500" : "text-blue-500"}`}>
                                    {msg.sender === username ? `You:` : `${msg.sender}:`}
                                </span>

                                <span className={"text-[10px] text-zinc-600"}>
                                    {format(msg.timeStamp,"HH:mm")}
                                </span>

                                <p className={"text-sm text-zinc-300 leading-relaxed break-all"}>
                                    <DecryptedMessage text={msg.text} secretKey={secretKey} />
                                </p>

                            </div>
                    </div>
                    </div>
                })}
            </div>
            
            <div className={"p-4 border-t border-zinc-800 bg-zinc-900/30"}>
                <div className={"flex flex-row"}>

                <div className={" flex-1 relative group"}>
                    <span className={"absolute left-4 top-1/2 -translate-y-1/2 text-green-500 animate-pulse"}>
                        {">"}
                    </span>
                    <input
                        value={input}
                        onChange={(e)=>{setInput(e.target.value)}}
                        onKeyDown={(e)=>{
                            if(e.key==="Enter" && input.trim()){
                                sendMessage({text: input});
                                inputRef.current?.focus();
                                setInput("");
                            }
                        }}
                        placeholder={"Type message..."}
                        autoFocus={true}
                        className={"w-full bg-black border border-zinc-800 focus:border-zinc-700 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-700 py-3 pl-8 pr-4 text-sm"}
                    />

                </div>
                <button onClick={()=>{
                    sendMessage({text: input});
                    setInput("");
                    inputRef.current?.focus();
                }}
                        disabled={!input.trim() || isPending}

                    className={"bg-zinc-800 text-zinc-400 px-6 text-sm font-bold hover:text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"}>
                    Send
                </button>
                </div>

            </div>
        </main>

    )
}
export default Page