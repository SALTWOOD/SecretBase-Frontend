import { API } from '@secret-base/api/src/types/api';

export class Requester {
    public async execute<T>(api: API) {
        const options = {
            method: api.method,
        };

        switch (api.method) {
            case 'POST':
            case 'PUT':
            case 'PATCH':
                Object.assign(options, { body: api.data });
                break;
            case 'GET':
            case 'DELETE':
            default:
                Object.assign(options, { params: api.data });
                break;
        }

        if (api.headers) Object.assign(options, { headers: api.headers });

        const response = await $fetch<T>(
            api.path,
            options,
        );
        return response;
    }
}

export function useRequester(): Requester {
    return new Requester();
}