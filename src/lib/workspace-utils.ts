export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateInviteCode(): string {
  return crypto.randomUUID().split('-')[0] + crypto.randomUUID().split('-')[1];
}
