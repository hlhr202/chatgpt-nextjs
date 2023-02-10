import fetch, {
    Blob,
    blobFrom,
    blobFromSync,
    File,
    fileFrom,
    fileFromSync,
    FormData,
    Headers,
    Request,
    Response,
} from "node-fetch";

if (!globalThis.fetch) {
    globalThis.fetch = fetch as any;
    globalThis.Headers = Headers;
    globalThis.Request = Request as any;
    globalThis.Response = Response as any;
}
