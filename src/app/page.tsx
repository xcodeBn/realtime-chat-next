"use client"

import {nanoid} from "nanoid";
import {useEffect, useState} from "react";

const generateUsername = () => {
    const adjectives = ["swift", "silent", "fierce", "brave", "clever"];
    const nouns = ["lion", "eagle", "shark", "wolf", "tiger"];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(100 + Math.random() * 900);
    return `${adjective}_${noun}${nanoid(7)}`;
}
const STORAGE_KEY = "chat_username";


export default function Home() {

    const [username,setUserName] = useState("");

    useEffect(() => {
        const main = () => {
            const storedUsername = localStorage.getItem(STORAGE_KEY);
            if (!storedUsername) {
                const generated = generateUsername();
                localStorage.setItem(STORAGE_KEY, generated);
                setUserName(generated);
                return;
            }
            setUserName(storedUsername);
        }
        main()
    }, []);
    return (<main className={"flex min-h-screen flex-col items-center justify-center p-4"}>
          <div className={"w-full max-w-md space-y-8"}>
              <div className={"text-center space-y-2"}>
                  <h1 className={"text-2xl font-bold tracking-tight text-green-500"}>
                      {">"}private chat
                  </h1>
                  <p className={"text-zinc-500 text-sm"}>
                      private self destructing chat room
                  </p>
              </div>
              <div className={"border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md"}>
                  <div className={"space-y-5"}>
                      <div className={"space-y-2"}>
                          <label className={"flex items-center text-zinc-500"}>
                              Your identity
                          </label>
                          <div className={"flex items-center gap-3"}>
                              <div className={"flex-1 bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-400 font-mono"}>
                                  {username}
                              </div>
                          </div>
                      </div>
                      <button className={"w-full bg-zinc-100 text-black p-3 text-sm font-bold hover:bg-zinc-50 hover:text-black transition-colors mt-2 cursor-pointer disabled:opacity-50"}>
                          Create SECURE ROOM
                      </button>
                  </div>
              </div>
          </div>
      </main>
  );
}
