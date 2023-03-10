import { useState, useRef, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { MessageResponse } from "@/interface/response";
import { ChatMessage } from "chatgpt";
import { useMap } from "react-use";
import { createMessages } from "@/mock/message";
import { useRouter } from "next/navigation";

const useSocket = () => {
    const [ready, setReady] = useState(false);
    const router = useRouter();
    const socket = useRef<ReturnType<typeof io>>();

    const socketInitializer = async () => {
        const res = await fetch("/api/socket");
        const json = await res.json();
        if (json.code === "SUCCESS") {
            socket.current = io();

            socket.current.on("connect", () => {
                setReady(true);
            });
        } else {
            router.replace("/");
        }
    };

    useEffect(() => {
        if (!ready) {
            socketInitializer();
        }
    }, [ready]);

    return { socket: socket.current, ready };
};

export const useSocketApi = () => {
    const { socket, ready } = useSocket();

    const [initializing, setInitializing] = useState(true);

    const [messagesMap, { set, reset }] = useMap<
        Record<string, MessageResponse<ChatMessage>>
    >({});

    const send = (payload: {
        parentMessageId?: string;
        conversationId?: string;
        message: string;
    }) => {
        socket?.send(payload);
    };

    useEffect(() => {
        if (ready) {
            socket?.on("message", (payload: MessageResponse<ChatMessage>) => {
                const id = payload.data.id;
                set(id, payload);
            });
        }
    }, [ready, set, socket]);

    const messages = useMemo(() => Object.entries(messagesMap), [messagesMap]);

    const latest = useMemo(() => {
        return messages.length ? messages[messages.length - 1]?.[1] : undefined;
    }, [messages]);

    const init = (entries: MessageResponse<ChatMessage>[]) => {
        entries.forEach((value) => set(value.data.id, value));
        setInitializing(false);
    };

    return { send, messages, latest, init, initializing, reset };
};
