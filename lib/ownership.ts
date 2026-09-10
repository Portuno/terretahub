export const isOwnContent = (
  ownerId: string | null | undefined,
  userId: string | null | undefined
): boolean => Boolean(ownerId && userId && ownerId === userId);
