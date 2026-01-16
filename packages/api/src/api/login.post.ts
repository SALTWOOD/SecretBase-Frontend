import { API } from "../types/api";
import { Method } from "../types/method";

export class PostLogin extends API {
    constructor(params: {
        email: string;
        password: string;
        captcha_token: string;
    }) {
        super("/login", Method.POST, params);
    }
}

export interface PostLoginResponse {
    id: number;
    token: string;
}