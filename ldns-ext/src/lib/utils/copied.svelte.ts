/**
 * Shared click-to-copy state: one copied key at a time, auto-reset after a
 * short delay. Replaces the per-component copyToClipboard/copiedField clones.
 */
export function createCopied(resetMs = 1600) {
  let field = $state<string | null>(null);
  return {
    is(key: string): boolean {
      return field === key;
    },
    async copy(text: string, key: string): Promise<void> {
      try {
        await navigator.clipboard.writeText(text);
        field = key;
        setTimeout(() => {
          if (field === key) field = null;
        }, resetMs);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };
}

export type CopiedState = ReturnType<typeof createCopied>;
