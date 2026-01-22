import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";
import {client} from "@/lib/client";
import {nanoid} from "nanoid";

const generateUsername = () => {
    const adjectives = ["swift", "silent", "fierce", "brave", "clever"];
    const nouns = ["lion", "eagle", "shark", "wolf", "tiger"];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(100 + Math.random() * 900);
    return `${adjective}_${noun}${nanoid(7)}_${number}`;
}
const STORAGE_KEY = "chat_username";



export const useUsername = () => {
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

    return {username}
}