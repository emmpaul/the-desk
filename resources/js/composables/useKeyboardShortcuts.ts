import { onMounted, onUnmounted } from 'vue';
import { dispatchKeydown, SHORTCUTS } from '@/composables/keyboardShortcuts';
import type { ShortcutId } from '@/composables/keyboardShortcuts';

/**
 * Wire the app-wide keyboard shortcuts to a window `keydown` listener for the
 * lifetime of the calling component. `handlers` maps a {@link ShortcutId} to
 * the action it runs; unmapped shortcuts are simply ignored.
 */
export function useKeyboardShortcuts(
    handlers: Partial<Record<ShortcutId, () => void>>,
): void {
    function onKeydown(event: KeyboardEvent): void {
        dispatchKeydown(event, SHORTCUTS, (id) => handlers[id]?.());
    }

    onMounted(() => window.addEventListener('keydown', onKeydown));
    onUnmounted(() => window.removeEventListener('keydown', onKeydown));
}
