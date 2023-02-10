// import "./fetch-polyfill";
// import KeyvSqlite from "@keyv/sqlite";
import { ChatGPTAPI } from "chatgpt";
// import Keyv from "keyv";
// import path from "path";

// const store = new KeyvSqlite({
//     uri: `sqlite://${path.resolve(process.cwd(), "./data.sqlite")}`,
//     table: "chatgpt",
// });

// const messageStore = new Keyv({ store, namespace: "chatgpt" });

export const api = new ChatGPTAPI({
    apiKey: process.env.apiKey as string,
    // messageStore,
});
