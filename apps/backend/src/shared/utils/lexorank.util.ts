/**
 * LexoRank Algorithm Implementation
 *
 * LexoRank는 문자열 기반 정렬 시스템으로, 두 요소 사이에 무한히 새로운 순서를 생성할 수 있습니다.
 * Jira, Trello 등에서 드래그앤드롭 정렬을 위해 사용되는 알고리즘입니다.
 */

const MIN_CHAR = '0';
const MAX_CHAR = 'z';
const MID_CHAR = 'U';

export class LexoRank {
    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    public getValue(): string {
        return this.value;
    }

    public toString(): string {
        return this.value;
    }

    /**
     * 첫 번째 순서 생성
     */
    public static min(): LexoRank {
        return new LexoRank(MID_CHAR);
    }

    /**
     * 두 LexoRank 사이의 순서 생성
     */
    public static between(a: LexoRank | null, b: LexoRank | null): LexoRank {
        if (!a && !b) {
            return LexoRank.min();
        }

        if (!a) {
            return new LexoRank(this.getBefore(b!.value));
        }

        if (!b) {
            return new LexoRank(this.getAfter(a.value));
        }

        return new LexoRank(this.getBetween(a.value, b.value));
    }

    /**
     * 문자열로부터 LexoRank 생성
     */
    public static parse(value: string): LexoRank {
        if (!value || typeof value !== 'string') {
            throw new Error('Invalid LexoRank value');
        }
        return new LexoRank(value);
    }

    /**
     * 주어진 값 이전의 순서 생성
     */
    private static getBefore(value: string): string {
        if (value === MIN_CHAR) {
            throw new Error('Cannot create rank before minimum');
        }

        const chars = value.split('');
        let result = '';

        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];

            if (char > MIN_CHAR) {
                // 현재 문자보다 작은 문자로 교체
                const prevChar = String.fromCharCode(char.charCodeAt(0) - 1);
                result += prevChar;

                // 나머지는 MAX_CHAR로 채움
                for (let j = i + 1; j < chars.length; j++) {
                    result += MAX_CHAR;
                }

                return result;
            } else {
                result += char;
            }
        }

        // 모든 문자가 MIN_CHAR인 경우
        return result + MIN_CHAR + MAX_CHAR;
    }

    /**
     * 주어진 값 이후의 순서 생성
     */
    private static getAfter(value: string): string {
        const chars = value.split('');
        let result = '';

        for (let i = chars.length - 1; i >= 0; i--) {
            const char = chars[i];

            if (char < MAX_CHAR) {
                // 현재 문자보다 큰 문자로 교체
                const nextChar = String.fromCharCode(char.charCodeAt(0) + 1);
                result = value.substring(0, i) + nextChar + value.substring(i + 1);
                return result;
            }
        }

        // 모든 문자가 MAX_CHAR인 경우
        return value + MID_CHAR;
    }

    /**
     * 두 값 사이의 순서 생성
     */
    private static getBetween(a: string, b: string): string {
        if (a >= b) {
            throw new Error('Invalid order: first value must be less than second');
        }

        const maxLength = Math.max(a.length, b.length);
        const aChars = a.padEnd(maxLength, MIN_CHAR).split('');
        const bChars = b.padEnd(maxLength, MIN_CHAR).split('');

        let result = '';
        let carry = false;

        for (let i = 0; i < maxLength; i++) {
            const aCode = aChars[i].charCodeAt(0);
            const bCode = bChars[i].charCodeAt(0);

            if (aCode === bCode) {
                result += aChars[i];
                continue;
            }

            // 중간값 계산
            const midCode = Math.floor((aCode + bCode) / 2);
            const midChar = String.fromCharCode(midCode);

            if (midCode > aCode) {
                result += midChar;
                return result;
            } else {
                // 중간값이 없는 경우 한 자리 더 추가
                result += aChars[i];

                // 다음 위치에 중간값 삽입
                const nextACode = (i + 1 < aChars.length) ? aChars[i + 1].charCodeAt(0) : MIN_CHAR.charCodeAt(0);
                const nextBCode = MAX_CHAR.charCodeAt(0);
                const nextMidCode = Math.floor((nextACode + nextBCode) / 2);
                result += String.fromCharCode(nextMidCode);

                return result;
            }
        }

        // 모든 자리가 같은 경우 (이론적으로 발생하지 않아야 함)
        result += MID_CHAR;
        return result;
    }

    /**
     * LexoRank 배열을 정렬
     */
    public static sort(ranks: LexoRank[]): LexoRank[] {
        return ranks.sort((a, b) => a.value.localeCompare(b.value));
    }

    /**
     * 두 LexoRank가 같은지 비교
     */
    public equals(other: LexoRank): boolean {
        return this.value === other.value;
    }

    /**
     * 두 LexoRank 비교 (-1: 작음, 0: 같음, 1: 큼)
     */
    public compareTo(other: LexoRank): number {
        return this.value.localeCompare(other.value);
    }

    /**
     * 순서가 유효한지 검증
     */
    public static validate(value: string): boolean {
        if (!value || typeof value !== 'string') {
            return false;
        }

        for (const char of value) {
            const code = char.charCodeAt(0);
            if (code < MIN_CHAR.charCodeAt(0) || code > MAX_CHAR.charCodeAt(0)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 배열의 각 요소에 LexoRank 할당
     */
    public static generateRanks(count: number): LexoRank[] {
        if (count <= 0) {
            return [];
        }

        const ranks: LexoRank[] = [];

        if (count === 1) {
            ranks.push(LexoRank.min());
        } else {
            // 첫 번째 요소
            let current = LexoRank.min();
            ranks.push(current);

            // 나머지 요소들을 위한 순서 생성
            for (let i = 1; i < count; i++) {
                current = new LexoRank(this.getAfter(current.value));
                ranks.push(current);
            }
        }

        return ranks;
    }
}

/**
 * LexoRank 유틸리티 함수들
 */
export class LexoRankUtil {
    /**
     * 드래그 앤 드롭으로 아이템을 이동할 때 새로운 순서 계산
     */
    public static calculateNewRank(
        items: Array<{ id: string; lexoRank: string }>,
        draggedId: string,
        newIndex: number
    ): string {
        // 드래그된 아이템을 제외한 배열 생성
        const filteredItems = items.filter(item => item.id !== draggedId);

        if (filteredItems.length === 0) {
            return LexoRank.min().getValue();
        }

        if (newIndex === 0) {
            // 맨 앞으로 이동
            const firstRank = LexoRank.parse(filteredItems[0].lexoRank);
            return LexoRank.between(null, firstRank).getValue();
        }

        if (newIndex >= filteredItems.length) {
            // 맨 뒤로 이동
            const lastRank = LexoRank.parse(filteredItems[filteredItems.length - 1].lexoRank);
            return LexoRank.between(lastRank, null).getValue();
        }

        // 중간에 삽입
        const beforeRank = LexoRank.parse(filteredItems[newIndex - 1].lexoRank);
        const afterRank = LexoRank.parse(filteredItems[newIndex].lexoRank);
        return LexoRank.between(beforeRank, afterRank).getValue();
    }

    /**
     * 기존 아이템들에 LexoRank 초기화
     */
    public static initializeRanks<T extends { id: string }>(
        items: T[]
    ): Array<T & { lexoRank: string }> {
        const ranks = LexoRank.generateRanks(items.length);

        return items.map((item, index) => ({
            ...item,
            lexoRank: ranks[index].getValue()
        }));
    }

    /**
     * LexoRank 기준으로 정렬
     */
    public static sortByRank<T extends { lexoRank: string }>(items: T[]): T[] {
        return [...items].sort((a, b) => a.lexoRank.localeCompare(b.lexoRank));
    }
}
