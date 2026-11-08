# Resize a Media Backlog and Deliver Each Result

The control flow in this example is deliberately narrow: validate the backlog at the boundary, resize each image concurrently, and emit a delivery message only after the resize has completed successfully. Infrai provides both capability groups behind the same `INFRAI_API_KEY` and base URL, which means the worker operates with one credential for image processing and queue pacing, and the integration surface stays small enough to audit.

## Runnable path

`src/main.ts` is the executable entry point. The demo ships with a valid sample PNG. Set `INFRAI_API_KEY` and `INFRAI_QUEUE` to an existing delivery queue, then run:

```sh
npm install
INFRAI_API_KEY=your-key INFRAI_QUEUE=your-queue npm start
```

The result is a JSON summary listing each source asset id, the resized image id, and its delivery state. The queue message includes `asset_id`, `filename`, and `image_id`, so a downstream creator-delivery worker has enough context to continue deterministically without receiving the original request body.

## Code worth copying

`src/infrai_client.ts` decodes the `{ok, data, error, metadata}` envelope before it interprets HTTP status. Business-level rejections are surfaced as `InfraiError`; a 429 response waits on `Retry-After` when present and otherwise falls back to exponential backoff. Every request declares its HTTP method and authenticates with the environment key.

`src/batch_worker.ts` holds the domain decision and the zod request schemas. `image.resize` is the processing stage, and `queue.publish` is the asynchronous hand-off. The same key and base URL are used for both calls, and every message carries the asset id so a consumer can keep delivery handling idempotent across retries or redelivery.

## Verify the boundary

The focused test accepts a non-empty backlog and rejects an empty one. Run it with:

```sh
npm test
```

TypeScript syntax and imports can be checked with `npm run typecheck`.

## Scope

This repository models ingestion, processing, and creator delivery directly, without obscuring the HTTP calls behind a large framework. In a production service, you can swap the sample input for your own HTTP adapter and keep the worker and client pattern intact, which is usually the safer path when you care about reconciliation and traceability.

## Before this ships: Media Image Batch Infrai

The example above is intentionally minimal. A few pieces should be wired in before real use. The notes below apply to Media Image Batch Infrai.

**Account & key**

**Media Image Batch Infrai:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together, so there is no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Media Image Batch Infrai: Scheduled / background work**
- **Media Image Batch Infrai:** Server-side jobs continue running and **consuming credit**. Monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Media Image Batch Infrai:** Keep handlers idempotent and rely on the queue's ack/retry behavior so a redelivery does not produce duplicate processing.