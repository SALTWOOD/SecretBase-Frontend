export class Response<T extends object> {
    constructor(
        public success: boolean,
        public message: string,
        public data: T,
    ) { }
}