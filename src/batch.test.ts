import assert from "node:assert/strict";
import { backlogBody } from "./batch_worker.js";

const parsed = backlogBody.parse({ queue: "delivery", items: [{ id: "a", image: "data:image/png;base64,x", filename: "a.png" }], width: 640, height: 360 });
assert.equal(parsed.items[0].id, "a");
assert.throws(() => backlogBody.parse({ queue: "delivery", items: [], width: 640, height: 360 }));
console.log("backlog boundary test passed");
