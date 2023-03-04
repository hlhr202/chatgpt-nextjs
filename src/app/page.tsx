"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleLogin = async () => {
        try {
            const res = await fetch("/api/auth/simple-login", {
                method: "POST",
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (data.code === "SUCCESS") {
                router.push("/chat");
            } else {
                alert(data.message);
            }
        } catch (e) {
            console.log(e);
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center">
            <input
                className="w-9/12 border-[1px] rounded-md m-1 p-2 dark:bg-zinc-700 aria-[disabled=true]:opacity-20 mb-10"
                placeholder="输入密码"
                onChange={(evt) => setPassword(evt.target.value)}
                value={password}
            />
            <button
                className="w-9/12 bg-cyan-900 border-[1px] rounded-md m-1 disabled:opacity-20 p-2"
                onClick={handleLogin}
            >
                登录
            </button>
        </div>
    );
}
