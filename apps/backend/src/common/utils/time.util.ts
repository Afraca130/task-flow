import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);

export class TimeUtil {
    /**
     * Get current date and time
     */
    static now(): Date {
        return dayjs().toDate();
    }

    /**
     * Format date to string
     */
    static format(date: Date, format?: string): string {
        return dayjs(date).format(format || 'YYYY-MM-DD HH:mm:ss');
    }

    /**
     * Format date to ISO string
     */
    static formatISO(date: Date): string {
        return dayjs(date).toISOString();
    }

    /**
     * Subtract time from date
     */
    static subtract(date: Date, amount: number, unit: dayjs.ManipulateType): Date {
        return dayjs(date).subtract(amount, unit).toDate();
    }

    /**
     * Add time to date
     */
    static add(date: Date, amount: number, unit: dayjs.ManipulateType): Date {
        return dayjs(date).add(amount, unit).toDate();
    }

    /**
     * Check if first date is after second date
     */
    static isAfter(date1: Date, date2: Date): boolean {
        return dayjs(date1).isAfter(dayjs(date2));
    }

    /**
     * Check if first date is before second date
     */
    static isBefore(date1: Date, date2: Date): boolean {
        return dayjs(date1).isBefore(dayjs(date2));
    }

    /**
     * Get difference between two dates
     */
    static diff(date1: Date, date2: Date, unit: dayjs.QUnitType | dayjs.OpUnitType): number {
        return dayjs(date1).diff(dayjs(date2), unit);
    }

    /**
     * Check if date is same as another date
     */
    static isSame(date1: Date, date2: Date, unit?: dayjs.OpUnitType): boolean {
        return dayjs(date1).isSame(dayjs(date2), unit);
    }

    /**
     * Parse string to date
     */
    static parse(dateString: string, format?: string): Date {
        return format ? dayjs(dateString, format).toDate() : dayjs(dateString).toDate();
    }

    /**
     * Get start of time unit
     */
    static startOf(date: Date, unit: dayjs.OpUnitType): Date {
        return dayjs(date).startOf(unit).toDate();
    }

    /**
     * Get end of time unit
     */
    static endOf(date: Date, unit: dayjs.OpUnitType): Date {
        return dayjs(date).endOf(unit).toDate();
    }

    /**
     * Get human readable relative time
     */
    static fromNow(date: Date): string {
        return dayjs(date).fromNow();
    }

    /**
     * Get human readable time difference
     */
    static to(date1: Date, date2: Date): string {
        return dayjs(date1).to(dayjs(date2));
    }

    /**
     * Check if date is valid
     */
    static isValid(date: Date | string): boolean {
        return dayjs(date).isValid();
    }

    /**
     * Convert to UTC
     */
    static toUTC(date: Date): Date {
        return dayjs(date).utc().toDate();
    }

    /**
     * Convert to timezone
     */
    static toTimezone(date: Date, timezone: string): Date {
        return dayjs(date).tz(timezone).toDate();
    }

    /**
     * Get unix timestamp
     */
    static unix(date: Date): number {
        return dayjs(date).unix();
    }

    /**
     * Create date from unix timestamp
     */
    static fromUnix(timestamp: number): Date {
        return dayjs.unix(timestamp).toDate();
    }
}
