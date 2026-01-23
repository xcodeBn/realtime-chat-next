"use client"
import { useEffect, useState } from "react";
import { decrypt } from "@/lib/crypto";

interface DecryptedMessageProps {
    text: string;
    secretKey: string | null;
}

export function DecryptedMessage({ text, secretKey }: DecryptedMessageProps) {
    const [decrypted, setDecrypted] = useState<string>("...");

    useEffect(() => {
        if (!secretKey) {
            // If no key is present, we can't decrypt.
            // We can check if it looks encrypted (contains ':') or just show placeholder.
            // For robustness, if it looks like plain text, show it (backward compatibility).
            if (text.includes(":")) {
                 setDecrypted("🔒 Encrypted message");
            } else {
                 setDecrypted(text);
            }
            return;
        }
        
        if(!text.includes(":")) {
             setDecrypted(text); // Assume plain text
             return;
        }

        let mounted = true;
        decrypt(text, secretKey).then((res) => {
            if (mounted) setDecrypted(res);
        });
        
        return () => { mounted = false; };
    }, [text, secretKey]);

    return <span className="break-all">{decrypted}</span>;
}
