import { InfraiClient } from "./infrai_client.js";
import { processBacklog } from "./batch_worker.js";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the example");

const queue = process.env.INFRAI_QUEUE;
if (!queue) throw new Error("Set INFRAI_QUEUE to an existing delivery queue");

const input = { queue, items: [{ id: "stream-001", image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAFklEQVR4nGNwaDhAEmIY1TCqYfhqAACldYAQpGTU2QAAAABJRU5ErkJggg==", filename: "stream-001.png" }], width: 1280, height: 720 };
const result = await processBacklog(new InfraiClient(key), input);
console.log(JSON.stringify({ processed: result.length, deliveries: result }, null, 2));
