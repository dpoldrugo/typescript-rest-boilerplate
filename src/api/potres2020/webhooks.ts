import {Path, POST, Security} from "typescript-rest";
import {Potres2020Webhooks} from "../../model/Potres2020WebhooksDocument";
import Potres2020WebhooksRepo from "../../model/Potres2020WebhooksDocument";

@Path('/api/potres2020/webhooks')
export class Webhooks {

    @POST
    @Security()
    public createWebhook(createWebhookRequest: Potres2020Webhooks): Promise<Potres2020Webhooks> {
        return Potres2020WebhooksRepo.create(createWebhookRequest);
    }
}