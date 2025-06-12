/**
 * Frontend LexoRank utilities for drag and drop operations
 */

export interface RankableItem {
    id: string;
    lexoRank: string;
}

/**
 * Calculate new position index based on drag and drop operation
 */
export function calculateNewPosition<T extends RankableItem>(
    items: T[],
    draggedId: string,
    newIndex: number
): number {
    // Remove dragged item from the array
    const filteredItems = items.filter(item => item.id !== draggedId);

    // Clamp newIndex to valid range
    return Math.max(0, Math.min(newIndex, filteredItems.length));
}

/**
 * Sort items by their LexoRank
 */
export function sortByRank<T extends RankableItem>(items: T[]): T[] {
    return [...items].sort((a, b) => a.lexoRank.localeCompare(b.lexoRank));
}

/**
 * Get the position of an item in the sorted array
 */
export function getItemPosition<T extends RankableItem>(
    items: T[],
    itemId: string
): number {
    const sortedItems = sortByRank(items);
    return sortedItems.findIndex(item => item.id === itemId);
}

/**
 * Insert item at new position in array (for optimistic updates)
 */
export function insertAtPosition<T>(
    array: T[],
    item: T,
    position: number
): T[] {
    const newArray = [...array];
    newArray.splice(position, 0, item);
    return newArray;
}

/**
 * Remove item from array
 */
export function removeItem<T extends RankableItem>(
    array: T[],
    itemId: string
): T[] {
    return array.filter(item => item.id !== itemId);
}

/**
 * Move item from one status to another (for optimistic updates)
 */
export function moveItemBetweenLists<T extends RankableItem>(
    sourceList: T[],
    targetList: T[],
    itemId: string,
    newPosition: number
): { source: T[]; target: T[] } {
    const item = sourceList.find(item => item.id === itemId);
    if (!item) {
        return { source: sourceList, target: targetList };
    }

    const newSource = removeItem(sourceList, itemId);
    const newTarget = insertAtPosition(targetList, item, newPosition);

    return {
        source: newSource,
        target: newTarget
    };
}

/**
 * Reorder item within the same list
 */
export function reorderWithinList<T extends RankableItem>(
    list: T[],
    itemId: string,
    newPosition: number
): T[] {
    const item = list.find(item => item.id === itemId);
    if (!item) {
        return list;
    }

    const withoutItem = removeItem(list, itemId);
    return insertAtPosition(withoutItem, item, newPosition);
}

/**
 * Validate LexoRank string
 */
export function isValidLexoRank(rank: string): boolean {
    if (!rank || typeof rank !== 'string') {
        return false;
    }

    // Check if all characters are in valid range
    const MIN_CHAR = '0'.charCodeAt(0);
    const MAX_CHAR = 'z'.charCodeAt(0);

    for (let i = 0; i < rank.length; i++) {
        const code = rank.charCodeAt(i);
        if (code < MIN_CHAR || code > MAX_CHAR) {
            return false;
        }
    }

    return true;
}
