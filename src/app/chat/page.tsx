"use client";
import { MessageResponse } from "@/interface/response";
import { useSocketApi } from "@/lib/socketapi";
import { ChatMessage } from "chatgpt";
import { useRef, useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import setupIndexedDB, { useIndexedDBStore } from "use-indexeddb";
import remarkGfm from "remark-gfm";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark as dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";

const dbConfig = {
    databaseName: "chatgpt",
    version: 1,
    stores: [
        {
            name: "message",
            id: { keyPath: "id", autoIncrement: false },
            indices: [
                {
                    name: "id",
                    keyPath: "id",
                    options: { unique: true },
                },
                {
                    name: "text",
                    keyPath: "text",
                    options: { unique: false },
                },
                {
                    name: "role",
                    keyPath: "role",
                    options: { unique: false },
                },
                {
                    name: "parentMessageId",
                    keyPath: "parentMessageId",
                    options: { unique: false },
                },
                {
                    name: "conversationId",
                    keyPath: "conversationId",
                    options: { unique: false },
                },
            ],
        },
    ],
};

export default function Home() {
    const editableRef = useRef<HTMLSpanElement>(null);

    const [lock, setLock] = useState(false);

    const { messages, send, latest, init, initializing, reset } =
        useSocketApi();

    const [message, setMessage] = useState("");

    const handleSend = async () => {
        const payload = latest
            ? {
                  parentMessageId: latest.data.id,
                  conversationId: latest.data.conversationId,
                  message,
              }
            : { message };

        send(payload);

        setLock(true);

        editableRef.current!.textContent = "";
    };

    const { add, getByID, getAll, deleteAll } = useIndexedDBStore<
        { id: string } & MessageResponse<ChatMessage>
    >("message");

    const upsert = useCallback(
        async (value: MessageResponse<ChatMessage>) => {
            if (value.completed) {
                const id = value.data.id;
                if (await getByID(value.data.id)) {
                    // do noting
                } else {
                    add({ id, ...value });
                }
            }
        },
        [add, getByID]
    );

    const initFromDb = async () => {
        await setupIndexedDB(dbConfig);
        const allData = (await getAll()).map(({ id, ...rest }) => rest);
        init(allData);
    };

    const clearHistory = () => {
        reset();
        deleteAll();
    };

    useEffect(() => {
        if (latest && !initializing) {
            setLock(false);
            document
                .querySelector(`#${latest.data.id}`)
                ?.scrollIntoView({ behavior: "smooth" });
            upsert(latest);
        }
    }, [initializing, latest, upsert]);

    useEffect(() => {
        initFromDb();
        SyntaxHighlighter.registerLanguage("javascript", javascript);
        SyntaxHighlighter.registerLanguage("typescript", javascript);
        SyntaxHighlighter.registerLanguage("ts", javascript);
        SyntaxHighlighter.registerLanguage("tsx", javascript);
        SyntaxHighlighter.registerLanguage("js", javascript);
        SyntaxHighlighter.registerLanguage("jsx", javascript);
    }, []);

    return (
        <main className="max-h-full min-h-full flex flex-col">
            <section className="m-2 flex-1 overflow-hidden flex">
                <ul className="border-[1px] w-full m-1 rounded-md max-h-full overflow-y-auto">
                    {messages.map(([id, message]) => {
                        return (
                            <li className="border-b-[1px]" id={id} key={id}>
                                <div className="p-3 dark:bg-zinc-700">
                                    {message.send}
                                </div>
                                <ReactMarkdown
                                    className="p-3"
                                    // rehypePlugins={[rehypeHighlight]}
                                    remarkPlugins={[remarkGfm]}
                                    // eslint-disable-next-line react/no-children-prop
                                    children={message.data.text}
                                    components={{
                                        code({
                                            node,
                                            inline,
                                            className,
                                            children,
                                            ...props
                                        }) {
                                            const match = /language-(\w+)/.exec(
                                                className || ""
                                            );
                                            const returnHighlighted =
                                                !inline && !!match;
                                            return returnHighlighted ? (
                                                <SyntaxHighlighter
                                                    style={dark as any}
                                                    language="javascript"
                                                    PreTag="div"
                                                    {...props}
                                                >
                                                    {String(children).replace(
                                                        /\n$/,
                                                        ""
                                                    )}
                                                </SyntaxHighlighter>
                                            ) : (
                                                <code
                                                    className={className}
                                                    {...props}
                                                >
                                                    {children}
                                                </code>
                                            );
                                        },
                                    }}
                                />
                            </li>
                        );
                    })}
                </ul>
            </section>
            <button
                onClick={clearHistory}
                className="bg-rose-900 border-[1px] rounded-md m-3 mt-0 min-h-[40px] disabled:opacity-20"
            >
                清除历史
            </button>
            <section className="m-2 mt-0 col-end-1 min-h-[50px] max-h-[120px] flex">
                <span
                    contentEditable={!lock}
                    role="textbox"
                    aria-disabled={lock}
                    className="flex-1 border-[1px] rounded-md m-1 p-2 dark:bg-zinc-700 overflow-y-auto aria-[disabled=true]:opacity-20"
                    suppressContentEditableWarning
                    ref={editableRef}
                    onInput={(evt) =>
                        setMessage(evt.currentTarget.innerText ?? "")
                    }
                />

                <button
                    className="bg-cyan-900 w-[100px] border-[1px] rounded-md m-1 disabled:opacity-20"
                    onClick={handleSend}
                    disabled={lock}
                >
                    发送
                </button>
            </section>
        </main>
    );
}
