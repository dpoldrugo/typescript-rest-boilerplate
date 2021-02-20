import {Errors, Path, POST} from "typescript-rest";
import {CheckSha256Request} from "../../model/CheckSha256Request";
import {CheckSha256Response} from "../../model/CheckSha256Response";
import {CheckSha256Util} from "../../classes/CheckSha256Util";
import Potres2020WebhooksRepo, {Potres2020Webhooks} from "../../model/Potres2020WebhooksDocument";

@Path('/api/potres2020/utils')
export class UtilsApi {

    private checkSha256Util: CheckSha256Util = new CheckSha256Util();

    @Path('/checkSha256')
    @POST
    public checkSha256(checkSha256Request: CheckSha256Request): Promise<CheckSha256Response> {
        return this.getSharedSecretForWebhookUrl(checkSha256Request.webhookUrl)
            .then(value => {
                if (value == null)
                    throw new Errors.BadRequestError(`Webhook not defined! Webhook: ${checkSha256Request.webhookUrl}`);
                return new CheckSha256Response(this.checkSha256Util.check(checkSha256Request, value.sharedSecret));
            });

    }

    private getSharedSecretForWebhookUrl(webhook_url: string): Promise<Potres2020Webhooks> {
        return Potres2020WebhooksRepo.findOne({url: webhook_url}).exec();
    }

}