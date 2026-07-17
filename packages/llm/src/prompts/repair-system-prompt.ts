export function createRepairPrompt(invalidResponse: string, validationErrors: string): string {
  return `Repair the response into valid JSON only. Do not add Markdown or commentary.\nValidation errors:\n${validationErrors}\n\nInvalid response:\n${invalidResponse}`;
}
