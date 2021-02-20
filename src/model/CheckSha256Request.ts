// Immutable data object
export class CheckSha256Request {
    public readonly sha256Request: string;
    public readonly webhookUrl: string;
    public readonly payload: string;

    constructor(sha256Request: string, webhookUrl: string, payload: string) {
        this.sha256Request = sha256Request;
        this.webhookUrl = webhookUrl;
        this.payload = payload;
    }
}