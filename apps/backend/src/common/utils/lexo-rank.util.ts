export class LexoRank {
    private static readonly BASE_36_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
    private static readonly INITIAL_RANK = 'n';
    private static readonly MIN_RANK = '0';
    private static readonly MAX_RANK = 'z';

    /**
     * Generate a rank between two existing ranks
     */
    static between(before?: string, after?: string): string {
        if (!before && !after) {
            return this.INITIAL_RANK;
        }

        if (!before) {
            return this.generateBefore(after!);
        }

        if (!after) {
            return this.generateAfter(before!);
        }

        return this.generateBetween(before, after);
    }

    /**
     * Generate a rank before the given rank
     */
    static before(rank: string): string {
        return this.generateBefore(rank);
    }

    /**
     * Generate a rank after the given rank
     */
    static after(rank: string): string {
        return this.generateAfter(rank);
    }

    /**
     * Calculate new rank based on position and existing ranks
     */
    static calculateNewRank(
        position: number,
        existingRanks: string[],
        insertType: 'before' | 'after' | 'between' = 'between'
    ): string {
        const sortedRanks = [...existingRanks].sort();

        if (sortedRanks.length === 0) {
            return this.generateInitialRank();
        }

        if (position <= 0) {
            return this.generateBefore(sortedRanks[0]);
        }

        if (position >= sortedRanks.length) {
            return this.generateAfter(sortedRanks[sortedRanks.length - 1]);
        }

        const beforeRank = position > 0 ? sortedRanks[position - 1] : undefined;
        const afterRank = position < sortedRanks.length ? sortedRanks[position] : undefined;

        return this.generateBetween(beforeRank, afterRank);
    }

    /**
     * Initialize ranks for a list of items
     */
    static initializeRanks(count: number): string[] {
        if (count <= 0) {
            return [];
        }

        if (count === 1) {
            return [this.generateInitialRank()];
        }

        const ranks: string[] = [];
        const step = this.BASE_36_CHARS.length / (count + 1);

        for (let i = 1; i <= count; i++) {
            const index = Math.floor(i * step);
            const char = this.BASE_36_CHARS[Math.min(index, this.BASE_36_CHARS.length - 1)];
            ranks.push(char);
        }

        return ranks;
    }

    /**
     * Generate initial rank
     */
    static generateInitialRank(): string {
        return this.INITIAL_RANK;
    }

    /**
     * Generate a rank after the given rank
     */
    static generateAfter(rank: string): string {
        if (!rank) {
            return this.generateInitialRank();
        }

        // If rank is a single character, try to increment it
        if (rank.length === 1) {
            const charIndex = this.BASE_36_CHARS.indexOf(rank);
            if (charIndex !== -1 && charIndex < this.BASE_36_CHARS.length - 1) {
                return this.BASE_36_CHARS[charIndex + 1];
            }
        }

        // Generate a rank after by appending a character
        return rank + this.BASE_36_CHARS[Math.floor(this.BASE_36_CHARS.length / 2)];
    }

    /**
     * Generate a rank before the given rank
     */
    private static generateBefore(rank: string): string {
        if (!rank) {
            return this.generateInitialRank();
        }

        // If rank is a single character, try to decrement it
        if (rank.length === 1) {
            const charIndex = this.BASE_36_CHARS.indexOf(rank);
            if (charIndex > 0) {
                return this.BASE_36_CHARS[charIndex - 1];
            }
        }

        // Generate a rank before by creating a smaller value
        const firstChar = rank[0];
        const charIndex = this.BASE_36_CHARS.indexOf(firstChar);

        if (charIndex > 0) {
            const prevChar = this.BASE_36_CHARS[charIndex - 1];
            return prevChar + this.BASE_36_CHARS[this.BASE_36_CHARS.length - 1];
        }

        // If we can't decrement, prepend a character
        return this.BASE_36_CHARS[0] + rank;
    }

    /**
     * Generate a rank between two ranks
     */
    private static generateBetween(before: string, after: string): string {
        if (!before || !after) {
            return this.generateInitialRank();
        }

        // Normalize lengths
        const maxLength = Math.max(before.length, after.length);
        const paddedBefore = before.padEnd(maxLength, this.BASE_36_CHARS[0]);
        const paddedAfter = after.padEnd(maxLength, this.BASE_36_CHARS[this.BASE_36_CHARS.length - 1]);

        let result = '';
        let carry = 0;

        for (let i = 0; i < maxLength; i++) {
            const beforeIndex = this.BASE_36_CHARS.indexOf(paddedBefore[i]);
            const afterIndex = this.BASE_36_CHARS.indexOf(paddedAfter[i]);

            if (beforeIndex === afterIndex) {
                result += this.BASE_36_CHARS[beforeIndex];
                continue;
            }

            const midIndex = Math.floor((beforeIndex + afterIndex) / 2);

            if (midIndex === beforeIndex) {
                result += this.BASE_36_CHARS[beforeIndex];
                // Need to continue to next position
                const nextPos = i + 1;
                if (nextPos < maxLength) {
                    const nextBeforeIndex = this.BASE_36_CHARS.indexOf(paddedBefore[nextPos]);
                    const nextAfterIndex = this.BASE_36_CHARS.indexOf(paddedAfter[nextPos]);
                    const nextMidIndex = Math.floor((nextBeforeIndex + this.BASE_36_CHARS.length) / 2);
                    result += this.BASE_36_CHARS[nextMidIndex % this.BASE_36_CHARS.length];
                } else {
                    result += this.BASE_36_CHARS[Math.floor(this.BASE_36_CHARS.length / 2)];
                }
                break;
            } else {
                result += this.BASE_36_CHARS[midIndex];
                break;
            }
        }

        return result || this.generateInitialRank();
    }

    /**
     * Validate if a string is a valid lexo rank
     */
    static isValidRank(rank: string): boolean {
        if (!rank || rank.length === 0) {
            return false;
        }

        return rank.split('').every(char => this.BASE_36_CHARS.includes(char));
    }

    /**
     * Compare two ranks
     */
    static compare(rank1: string, rank2: string): number {
        return rank1.localeCompare(rank2);
    }

    /**
     * Sort items by their lexo rank
     */
    static sortByRank<T extends { lexoRank: string }>(items: T[]): T[] {
        return [...items].sort((a, b) => this.compare(a.lexoRank, b.lexoRank));
    }

    /**
     * Rebalance ranks when they become too long or similar
     */
    static rebalanceRanks(ranks: string[]): string[] {
        const sortedRanks = [...ranks].sort();
        const count = sortedRanks.length;

        if (count <= 1) {
            return sortedRanks;
        }

        return this.initializeRanks(count);
    }

    /**
     * Get the next available rank in a sequence
     */
    static getNextRank(existingRanks: string[]): string {
        if (existingRanks.length === 0) {
            return this.generateInitialRank();
        }

        const sortedRanks = [...existingRanks].sort();
        return this.generateAfter(sortedRanks[sortedRanks.length - 1]);
    }

    /**
     * Get the previous available rank in a sequence
     */
    static getPrevRank(existingRanks: string[]): string {
        if (existingRanks.length === 0) {
            return this.generateInitialRank();
        }

        const sortedRanks = [...existingRanks].sort();
        return this.generateBefore(sortedRanks[0]);
    }
}
