import { getStore } from '@netlify/blobs'

const STORE_NAME = 'user-uploads'

function getKey(userId: string, datasetId: string): string {
  return `${userId}/${datasetId}`
}

/**
 * Upload a binary buffer to Netlify Blobs, keyed by userId/datasetId.
 */
export async function uploadBlob(
  userId: string,
  datasetId: string,
  buffer: Buffer,
  metadata: { filename: string; mimeType: string }
): Promise<void> {
  const store = getStore(STORE_NAME)
  const key = getKey(userId, datasetId)
  await store.set(key, buffer, { metadata })
}

/**
 * Download a binary buffer from Netlify Blobs.
 * Throws if the key does not exist.
 */
export async function downloadBlob(
  userId: string,
  datasetId: string
): Promise<Buffer> {
  const store = getStore(STORE_NAME)
  const key = getKey(userId, datasetId)
  const arrayBuffer = await store.get(key, { type: 'arrayBuffer' })

  if (!arrayBuffer) {
    throw new Error(`Blob not found: ${key}`)
  }

  return Buffer.from(arrayBuffer)
}

/**
 * Delete a blob from Netlify Blobs.
 */
export async function deleteBlob(
  userId: string,
  datasetId: string
): Promise<void> {
  const store = getStore(STORE_NAME)
  const key = getKey(userId, datasetId)
  await store.delete(key)
}
