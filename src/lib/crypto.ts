
function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export async function generateKey(): Promise<string> {
    const key = await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
    const exported = await window.crypto.subtle.exportKey("raw", key);
    // Replace +/ with -_ for URL safety if desired, but standard base64 is fine for hash
    return bufferToBase64(exported);
}

async function importKey(keyStr: string): Promise<CryptoKey> {
    const keyBuffer = base64ToBuffer(keyStr);
    return await window.crypto.subtle.importKey(
        "raw",
        keyBuffer,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encrypt(text: string, keyStr: string): Promise<string> {
    const key = await importKey(keyStr);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for AES-GCM
    const encodedText = new TextEncoder().encode(text);

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encodedText
    );

    // Combine IV and Ciphertext for storage: IV:Ciphertext
    const ivBase64 = bufferToBase64(iv.buffer);
    const contentBase64 = bufferToBase64(encryptedContent);
    return `${ivBase64}:${contentBase64}`;
}

export async function decrypt(encryptedData: string, keyStr: string): Promise<string> {
    try {
        const [ivBase64, contentBase64] = encryptedData.split(':');
        if (!ivBase64 || !contentBase64) return "[Invalid Encrypted Message]";

        const key = await importKey(keyStr);
        const iv = base64ToBuffer(ivBase64);
        const content = base64ToBuffer(contentBase64);

        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            key,
            content
        );

        return new TextDecoder().decode(decryptedContent);
    } catch (e) {
        console.error("Decryption failed", e);
        return "🔒 [Decryption Failed]";
    }
}
