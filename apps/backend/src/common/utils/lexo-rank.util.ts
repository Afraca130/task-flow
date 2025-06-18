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

        // position이 기존 아이템들 사이에 위치할 때
        const beforeRank = sortedRanks[position - 1];
        const afterRank = sortedRanks[position];

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

        // 단일 문자인 경우 다음 문자로 증가 시도
        if (rank.length === 1) {
            const charIndex = this.BASE_36_CHARS.indexOf(rank);
            if (charIndex !== -1 && charIndex < this.BASE_36_CHARS.length - 1) {
                return this.BASE_36_CHARS[charIndex + 1];
            }
        }

        // 뒤에 중간값 문자 추가
        const midChar = this.BASE_36_CHARS[Math.floor(this.BASE_36_CHARS.length / 2)];
        return rank + midChar;
    }

    /**
     * Generate a rank before the given rank
     */
    private static generateBefore(rank: string): string {
        if (!rank) {
            return this.generateInitialRank();
        }

        // 단일 문자인 경우 이전 문자로 감소 시도
        if (rank.length === 1) {
            const charIndex = this.BASE_36_CHARS.indexOf(rank);
            if (charIndex > 0) {
                return this.BASE_36_CHARS[charIndex - 1];
            }
            // 첫 번째 문자인경우 앞에 0을 붙여서 더 작은값 생성
            return this.BASE_36_CHARS[0] + rank;
        }

        // 첫 번째 문자를 기준으로 이전 값 생성
        const firstChar = rank[0];
        const charIndex = this.BASE_36_CHARS.indexOf(firstChar);

        if (charIndex > 0) {
            const prevChar = this.BASE_36_CHARS[charIndex - 1];
            // 이전 문자 + 최대값으로 해당 범위의 끝부분 생성
            return prevChar + this.BASE_36_CHARS[this.BASE_36_CHARS.length - 1];
        }

        // 첫 번째 문자가 '0'인 경우, 앞에 '0'을 추가
        return this.BASE_36_CHARS[0] + rank;
    }

    /**
     * Generate a rank between two ranks (핵심 수정)
     */
    private static generateBetween(before: string, after: string): string {
        if (!before || !after) {
            return this.generateInitialRank();
        }

        // 두 랭크가 같으면 after 뒤에 생성
        if (before === after) {
            return this.generateAfter(after);
        }

        // 길이를 맞춤 (짧은 쪽에 '0' 패딩)
        const maxLength = Math.max(before.length, after.length);
        const paddedBefore = before.padEnd(maxLength, '0');
        const paddedAfter = after.padEnd(maxLength, '0');

        let result = '';

        for (let i = 0; i < maxLength; i++) {
            const beforeChar = paddedBefore[i];
            const afterChar = paddedAfter[i];

            const beforeIndex = this.BASE_36_CHARS.indexOf(beforeChar);
            const afterIndex = this.BASE_36_CHARS.indexOf(afterChar);

            if (beforeIndex === afterIndex) {
                // 같은 문자면 그대로 추가하고 다음 자리로
                result += beforeChar;
                continue;
            }

            // 인덱스 차이가 1보다 크면 중간값 계산 가능
            if (afterIndex - beforeIndex > 1) {
                const midIndex = Math.floor((beforeIndex + afterIndex) / 2);
                result += this.BASE_36_CHARS[midIndex];
                break;
            }

            // 인덱스 차이가 1인 경우 (연속된 문자)
            if (afterIndex - beforeIndex === 1) {
                result += beforeChar;

                // 다음 자리에서 중간값을 찾아야 함
                if (i + 1 < maxLength) {
                    const nextBeforeChar = paddedBefore[i + 1];
                    const nextBeforeIndex = this.BASE_36_CHARS.indexOf(nextBeforeChar);

                    // before의 다음 문자 뒤에 중간값 추가
                    if (nextBeforeIndex < this.BASE_36_CHARS.length - 1) {
                        const nextMidIndex = Math.floor((nextBeforeIndex + this.BASE_36_CHARS.length) / 2);
                        result += this.BASE_36_CHARS[nextMidIndex];
                        break;
                    }
                }

                // 마지막 자리거나 다른 방법이 없으면 중간 문자 추가
                const midChar = this.BASE_36_CHARS[Math.floor(this.BASE_36_CHARS.length / 2)];
                result += midChar;
                break;
            }
        }

        // 결과가 비어있거나 before보다 작거나 같으면 안전한 값 반환
        if (!result || result <= before) {
            return before + this.BASE_36_CHARS[1];
        }

        // 결과가 after보다 크거나 같으면 안전한 값 반환
        if (result >= after) {
            const beforeIndex = this.BASE_36_CHARS.indexOf(before[0] || '0');
            const afterIndex = this.BASE_36_CHARS.indexOf(after[0] || 'z');

            if (afterIndex - beforeIndex > 1) {
                const midIndex = Math.floor((beforeIndex + afterIndex) / 2);
                return this.BASE_36_CHARS[midIndex];
            }

            return before + '1';
        }

        return result;
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
