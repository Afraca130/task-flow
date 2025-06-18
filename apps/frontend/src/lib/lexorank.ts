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

/**
 * Calculate LexoRank between two ranks
 */
export function between(left: string, right: string): string {
    console.log('🔄 LexoRank between:', { left, right });

    // Ensure left < right
    if (left >= right) {
        console.warn('⚠️ Left rank >= right rank, adjusting');
        const newRank = left + '1';
        console.log('✅ Generated rank:', newRank);
        return newRank;
    }

    // Simple string-based interpolation
    const result = generateBetween(left, right);
    console.log('✅ Generated between rank:', result);
    return result;
}

/**
 * Calculate LexoRank before a given rank
 */
export function before(rank: string): string {
    console.log('⬆️ LexoRank before:', rank);

    // If rank is empty or starts with '0', prepend with a smaller character
    if (!rank || rank.startsWith('0')) {
        const result = '0' + rank;
        console.log('✅ Generated before rank:', result);
        return result;
    }

    // Decrement the last character if possible
    const lastChar = rank.slice(-1);
    const lastCharCode = lastChar.charCodeAt(0);

    if (lastCharCode > 48) { // Greater than '0'
        const newLastChar = String.fromCharCode(lastCharCode - 1);
        const result = rank.slice(0, -1) + newLastChar + 'z';
        console.log('✅ Generated before rank:', result);
        return result;
    }

    // Default fallback
    const result = rank.slice(0, -1) + '0';
    console.log('✅ Generated before rank (fallback):', result);
    return result;
}

/**
 * Calculate LexoRank after a given rank
 */
export function after(rank: string): string {
    console.log('⬇️ LexoRank after:', rank);

    const result = rank + '1';
    console.log('✅ Generated after rank:', result);
    return result;
}

/**
 * Generate a rank between two given ranks
 */
function generateBetween(left: string, right: string): string {
    const maxLength = Math.max(left.length, right.length);
    const leftPadded = left.padEnd(maxLength, '0');
    const rightPadded = right.padEnd(maxLength, '0');

    let result = '';
    let carry = false;

    for (let i = 0; i < maxLength; i++) {
        const leftChar = leftPadded[i];
        const rightChar = rightPadded[i];

        if (leftChar === rightChar) {
            result += leftChar;
            continue;
        }

        const leftCode = leftChar.charCodeAt(0);
        const rightCode = rightChar.charCodeAt(0);
        const midCode = Math.floor((leftCode + rightCode) / 2);

        if (midCode === leftCode) {
            result += leftChar + '1';
            break;
        } else {
            result += String.fromCharCode(midCode);
            break;
        }
    }

    return result || (left + '1');
}

/**
 * Calculate new LexoRank for item at new position
 */
export function calculateNewLexoRank<T extends RankableItem>(
    items: T[],
    draggedId: string,
    newIndex: number
): string {
    // Sort items by rank and filter out the dragged item
    const sortedItems = sortByRank(items.filter(item => item.id !== draggedId));

    // If inserting at the beginning
    if (newIndex === 0) {
        if (sortedItems.length === 0) {
            return 'U'; // Initial rank
        }
        return before(sortedItems[0].lexoRank);
    }

    // If inserting at the end
    if (newIndex >= sortedItems.length) {
        if (sortedItems.length === 0) {
            return 'U'; // Initial rank
        }
        return after(sortedItems[sortedItems.length - 1].lexoRank);
    }

    // If inserting between two items
    const leftRank = sortedItems[newIndex - 1].lexoRank;
    const rightRank = sortedItems[newIndex].lexoRank;
    return between(leftRank, rightRank);
}

/**
 * Convert rank string to number for calculation
 */
function rankToNumber(rank: string): number {
    let result = 0;
    for (let i = 0; i < rank.length; i++) {
        result = result * 62 + charToNumber(rank.charAt(i));
    }
    return result;
}

/**
 * Convert number to rank string
 */
function numberToRank(num: number): string {
    if (num === 0) return '0';

    let result = '';
    while (num > 0) {
        result = numberToChar(num % 62) + result;
        num = Math.floor(num / 62);
    }
    return result || '0';
}

/**
 * Convert character to number
 */
function charToNumber(char: string): number {
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) return code - 48; // 0-9
    if (code >= 65 && code <= 90) return code - 55; // A-Z
    if (code >= 97 && code <= 122) return code - 61; // a-z
    return 0;
}

/**
 * Convert number to character
 */
function numberToChar(num: number): string {
    if (num < 10) return String.fromCharCode(num + 48); // 0-9
    if (num < 36) return String.fromCharCode(num + 55); // A-Z
    return String.fromCharCode(num + 61); // a-z
}
