import type { Method } from "./method";

export abstract class API {
    public readonly path: string;

    protected constructor(
        path: string,
        public readonly method: Method,
        public readonly params: Record<string, unknown>,
        public readonly headers?: Record<string, string>,
    ) {
        this.path = `/api/v1${path}`;
    }
}