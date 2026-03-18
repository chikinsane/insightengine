import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

/**
 * Returns a singleton Anthropic client instance.
 * Reads ANTHROPIC_API_KEY from environment automatically.
 */
export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic()
  }
  return _client
}
