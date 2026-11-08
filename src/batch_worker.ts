import { z } from "zod";
import { InfraiClient } from "./infrai_client.js";

export const mediaItem = z.object({ id: z.string().min(1), image: z.string().min(1), filename: z.string().min(1) });
export const backlogBody = z.object({ queue: z.string().min(1), items: z.array(mediaItem).min(1), width: z.number().int().positive(), height: z.number().int().positive() });
export type Backlog = z.infer<typeof backlogBody>;
const resizeCapability = "image.resize";

export async function processBacklog(client: InfraiClient, input: unknown) {
  const backlog = backlogBody.parse(input);
  return Promise.all(backlog.items.map(async item => {
    const resized = await client.request<{ id: string }>("/v1/image/resize", "POST", {
      image: item.image, width: backlog.width, height: backlog.height, fit: "cover", enlarge: false, format: "webp", store: true
    });
    await client.request("/v1/queue/publish", "POST", { queue: backlog.queue, payload: { asset_id: item.id, filename: item.filename, image_id: resized.id } });
    return { assetId: item.id, imageId: resized.id, delivered: true };
  }));
}
