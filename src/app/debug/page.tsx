"use client";

import { useRouter } from "next/navigation";
import { ChatCompletionRequestMessage } from "openai";
import { useState } from "react";

export default function Page() {
    const [content, setContent] = useState("");
    const router = useRouter();

    const handleSubmit = async () => {
        const messages: ChatCompletionRequestMessage[] = [
            { role: "user", content },
        ];

        fetch("/api/debug/token", {
            method: "POST",
            body: JSON.stringify({ messages }),
        });
    };

    return (
        <div className="h-full flex flex-col items-center justify-center">
            <input
                className="w-9/12 border-[1px] rounded-md m-1 p-2 dark:bg-zinc-700 aria-[disabled=true]:opacity-20 mb-10"
                onChange={(evt) => setContent(evt.target.value)}
                value={content}
            />
            <button
                className="w-9/12 bg-cyan-900 border-[1px] rounded-md m-1 disabled:opacity-20 p-2"
                onClick={handleSubmit}
            >
                提交
            </button>
        </div>
    );
}
