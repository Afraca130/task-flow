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

        // 마지막 문자부터 역순으로 처리
        for (let i = chars.length - 1; i >= 0; i--) {
            const char = chars[i];

            if (char > MIN_CHAR) {
                // 현재 문자보다 작은 문자로 교체
                const prevChar = String.fromCharCode(char.charCodeAt(0) - 1);
                chars[i] = prevChar;

                // 뒤의 모든 문자를 MAX_CHAR로 설정
                for (let j = i + 1; j < chars.length; j++) {
                    chars[j] = MAX_CHAR;
                }

                return chars.join('');
            }
        }

        // 모든 문자가 MIN_CHAR인 경우 - 앞에 MIN_CHAR 추가
        return MIN_CHAR + value;
    }

    /**
     * 주어진 값 이후의 순서 생성
     */
    private static getAfter(value: string): string {
        const chars = value.split('');

        // 마지막 문자부터 역순으로 처리
        for (let i = chars.length - 1; i >= 0; i--) {
            const char = chars[i];

            if (char < MAX_CHAR) {
                // 현재 문자보다 큰 문자로 교체
                const nextChar = String.fromCharCode(char.charCodeAt(0) + 1);
                chars[i] = nextChar;

                // 뒤의 모든 문자를 MIN_CHAR로 설정
                for (let j = i + 1; j < chars.length; j++) {
                    chars[j] = MIN_CHAR;
                }

                return chars.join('');
            }
        }

        // 모든 문자가 MAX_CHAR인 경우 - 뒤에 MIN_CHAR 추가
        return value + MIN_CHAR;
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

        for (let i = 0; i < maxLength; i++) {
            const aCode = aChars[i].charCodeAt(0);
            const bCode = bChars[i].charCodeAt(0);

            if (aCode === bCode) {
                result += aChars[i];
                continue;
            }

            // 두 문자 사이에 중간값이 있는지 확인
            const diff = bCode - aCode;

            if (diff > 1) {
                // 중간값 계산
                const midCode = aCode + Math.floor(diff / 2);
                result += String.fromCharCode(midCode);
                return result;
            } else {
                // 차이가 1인 경우 - 더 긴 문자열 생성
                result += aChars[i];

                // 다음 자리에서 중간값 생성
                const nextACode = (i + 1 < aChars.length) ? aChars[i + 1].charCodeAt(0) : MIN_CHAR.charCodeAt(0);
                const nextBCode = MAX_CHAR.charCodeAt(0);

                if (nextACode < nextBCode) {
                    const nextMidCode = nextACode + Math.floor((nextBCode - nextACode) / 2);
                    result += String.fromCharCode(nextMidCode);
                    return result;
                } else {
                    // 재귀적으로 더 긴 문자열 생성
                    result += String.fromCharCode(nextACode + 1);
                    return result;
                }
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
            return ranks;
        }

        // 균등하게 분배된 초기 순서 생성
        const step = Math.floor((MAX_CHAR.charCodeAt(0) - MIN_CHAR.charCodeAt(0)) / (count + 1));

        for (let i = 1; i <= count; i++) {
            const charCode = MIN_CHAR.charCodeAt(0) + (step * i);
            const char = String.fromCharCode(Math.min(charCode, MAX_CHAR.charCodeAt(0) - 1));
            ranks.push(new LexoRank(char));
        }

        return ranks;
    }
}

/**
 * LexoRank 유틸리티 함수들
 */
export class LexoRankUtil {
    private static readonly logger = console;

    /**
     * 첫 번째 작업을 위한 초기 LexoRank 생성
     */
    public static generateInitialRank(): string {
        return LexoRank.min().getValue();
    }

    /**
     * 주어진 LexoRank 이후의 새로운 LexoRank 생성
     */
    public static generateAfter(rank: string): string {
        const lexoRank = LexoRank.parse(rank);
        const afterRank = LexoRank.between(lexoRank, null);
        return afterRank.getValue();
    }

    /**
     * 주어진 LexoRank 이전의 새로운 LexoRank 생성
     */
    public static generateBefore(rank: string): string {
        const lexoRank = LexoRank.parse(rank);
        const beforeRank = LexoRank.between(null, lexoRank);
        return beforeRank.getValue();
    }

    /**
     * 두 LexoRank 사이의 새로운 LexoRank 생성
     */
    public static generateBetween(rankA: string, rankB: string): string {
        const lexoRankA = LexoRank.parse(rankA);
        const lexoRankB = LexoRank.parse(rankB);
        const betweenRank = LexoRank.between(lexoRankA, lexoRankB);
        return betweenRank.getValue();
    }

    /**
     * 드래그 앤 드롭으로 아이템을 이동할 때 새로운 순서 계산
     */
    public static calculateNewRank(
        items: Array<{ id: string; lexoRank: string }>,
        draggedId: string,
        newIndex: number
    ): string {
        console.log('calculateNewRank called:', {
            itemsCount: items.length,
            draggedId,
            newIndex,
            items: items.map(item => ({ id: item.id, rank: item.lexoRank }))
        });

        // 드래그된 아이템을 제외한 배열 생성하고 정렬
        const filteredItems = items
            .filter(item => item.id !== draggedId)
            .sort((a, b) => a.lexoRank.localeCompare(b.lexoRank));

        console.log('Filtered and sorted items:', filteredItems.map(item => ({ id: item.id, rank: item.lexoRank })));

        // 첫 번째 아이템인 경우
        if (filteredItems.length === 0 || newIndex === 0) {
            if (filteredItems.length === 0) {
                console.log('No items, returning initial rank');
                return LexoRank.min().getValue();
            }

            const firstRank = LexoRank.parse(filteredItems[0].lexoRank);
            const newRank = LexoRank.between(null, firstRank).getValue();
            console.log('Moving to front, new rank:', newRank);
            return newRank;
        }

        // 인덱스 범위 검증 및 조정
        const safeIndex = Math.min(newIndex, filteredItems.length);
        console.log('Safe index:', safeIndex, 'of', filteredItems.length);

        // 마지막 위치인 경우
        if (safeIndex >= filteredItems.length) {
            const lastRank = LexoRank.parse(filteredItems[filteredItems.length - 1].lexoRank);
            const newRank = LexoRank.between(lastRank, null).getValue();
            console.log('Moving to end, new rank:', newRank);
            return newRank;
        }

        // 중간에 삽입하는 경우
        const prevRank = LexoRank.parse(filteredItems[safeIndex - 1].lexoRank);
        const nextRank = LexoRank.parse(filteredItems[safeIndex].lexoRank);

        console.log('Between ranks:', {
            prev: prevRank.getValue(),
            next: nextRank.getValue(),
            prevIndex: safeIndex - 1,
            nextIndex: safeIndex
        });

        // 순서 검증
        if (prevRank.getValue() >= nextRank.getValue()) {
            console.warn('Invalid order detected, regenerating all ranks');
            // 전체 순서 재생성
            const newRanks = LexoRank.generateRanks(filteredItems.length + 1);
            const newRank = newRanks[safeIndex].getValue();
            console.log('Generated new rank from regeneration:', newRank);
            return newRank;
        }

        // 같은 rank 검증
        if (prevRank.getValue() === nextRank.getValue()) {
            console.warn('Same ranks detected, regenerating all ranks');
            const newRanks = LexoRank.generateRanks(filteredItems.length + 1);
            const newRank = newRanks[safeIndex].getValue();
            console.log('Generated new rank from same rank fix:', newRank);
            return newRank;
        }

        // 정상적인 between 계산
        try {
            const newRank = LexoRank.between(prevRank, nextRank).getValue();
            console.log('Generated between rank:', newRank);

            // 생성된 rank가 유효한지 검증
            if (newRank <= prevRank.getValue() || newRank >= nextRank.getValue()) {
                console.warn('Generated rank is out of bounds, regenerating');
                const newRanks = LexoRank.generateRanks(filteredItems.length + 1);
                const fallbackRank = newRanks[safeIndex].getValue();
                console.log('Using fallback rank:', fallbackRank);
                return fallbackRank;
            }

            return newRank;
        } catch (error) {
            console.error('Error generating between rank:', error);
            // 에러 발생 시 전체 재생성
            const newRanks = LexoRank.generateRanks(filteredItems.length + 1);
            const fallbackRank = newRanks[safeIndex].getValue();
            console.log('Using error fallback rank:', fallbackRank);
            return fallbackRank;
        }
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
