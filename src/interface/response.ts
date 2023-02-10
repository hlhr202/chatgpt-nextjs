export interface MessageResponse<T> {
    completed: boolean;
    data: T;
    send: string;
}
