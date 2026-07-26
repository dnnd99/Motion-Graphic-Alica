import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export const handler: Handler = async (event) => {
  const jobId = event.queryStringParameters?.jobId;
  if (!jobId) {
    return { statusCode: 400, body: JSON.stringify({ error: "jobId is required" }) };
  }

  const store = getStore("canvas-jobs");
  const job = await store.get(jobId, { type: "json" });

  if (!job) {
    return { statusCode: 200, body: JSON.stringify({ status: "pending" }) };
  }

  return { statusCode: 200, body: JSON.stringify(job) };
};
