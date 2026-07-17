import { PublicConfigResponseSchema } from '@grammar/shared';
import { apiRequest } from './client.js';

export function getPublicConfig() {
  return apiRequest('/api/config', PublicConfigResponseSchema);
}
