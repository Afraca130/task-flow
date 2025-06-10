import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import ko from 'dayjs/locale/ko';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import duration from 'dayjs/plugin/duration';

// dayjs 플러그인 등록
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(duration);

// 한국어 로케일 설정
dayjs.locale(ko);

/**
 * 시간 관련 유틸리티 클래스
 */
export class TimeUtil {
  private static readonly DEFAULT_TIMEZONE = 'Asia/Seoul';
  private static readonly DEFAULT_FORMAT = 'YYYY-MM-DD HH:mm:ss';
  private static readonly DATE_FORMAT = 'YYYY-MM-DD';
  private static readonly TIME_FORMAT = 'HH:mm:ss';
  private static readonly DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
  private static readonly ISO_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]';

  /**
   * 현재 시간을 반환합니다
   */
  static now(): Date {
    return dayjs().toDate();
  }

  /**
   * 현재 시간을 UTC로 반환합니다
   */
  static utcNow(): Date {
    return dayjs.utc().toDate();
  }

  /**
   * 현재 시간을 한국 시간대로 반환합니다
   */
  static koreanNow(): Date {
    return dayjs().tz(this.DEFAULT_TIMEZONE).toDate();
  }

  /**
   * 날짜를 포맷팅합니다
   */
  static format(date: Date | string | null, format?: string): string {
    if (!date) return '';
    return dayjs(date).format(format || this.DEFAULT_FORMAT);
  }

  /**
   * 날짜를 한국 시간대로 포맷팅합니다
   */
  static formatKorean(date: Date | string | null, format?: string): string {
    if (!date) return '';
    return dayjs(date).tz(this.DEFAULT_TIMEZONE).format(format || this.DEFAULT_FORMAT);
  }

  /**
   * 날짜만 포맷팅합니다 (YYYY-MM-DD)
   */
  static formatDate(date: Date | string | null): string {
    if (!date) return '';
    return dayjs(date).format(this.DATE_FORMAT);
  }

  /**
   * 시간만 포맷팅합니다 (HH:mm:ss)
   */
  static formatTime(date: Date | string | null): string {
    if (!date) return '';
    return dayjs(date).format(this.TIME_FORMAT);
  }

  /**
   * ISO 형식으로 포맷팅합니다
   */
  static formatISO(date: Date | string | null): string {
    if (!date) return '';
    return dayjs(date).utc().format(this.ISO_FORMAT);
  }

  /**
   * 상대적 시간을 반환합니다 (예: 2시간 전, 3일 후)
   */
  static fromNow(date: Date | string | null): string {
    if (!date) return '';
    return dayjs(date).fromNow();
  }

  /**
   * 두 날짜 사이의 차이를 반환합니다
   */
  static diff(date1: Date | string, date2: Date | string, unit: 'day' | 'hour' | 'minute' | 'second' = 'day'): number {
    return dayjs(date1).diff(dayjs(date2), unit);
  }

  /**
   * 날짜에 시간을 더합니다
   */
  static add(date: Date | string, amount: number, unit: 'day' | 'hour' | 'minute' | 'second'): Date {
    return dayjs(date).add(amount, unit).toDate();
  }

  /**
   * 날짜에서 시간을 뺍니다
   */
  static subtract(date: Date | string, amount: number, unit: 'day' | 'hour' | 'minute' | 'second'): Date {
    return dayjs(date).subtract(amount, unit).toDate();
  }

  /**
   * 하루의 시작 시간을 반환합니다 (00:00:00)
   */
  static startOfDay(date: Date | string): Date {
    return dayjs(date).startOf('day').toDate();
  }

  /**
   * 하루의 끝 시간을 반환합니다 (23:59:59)
   */
  static endOfDay(date: Date | string): Date {
    return dayjs(date).endOf('day').toDate();
  }

  /**
   * 이번 주의 시작 시간을 반환합니다
   */
  static startOfWeek(date: Date | string): Date {
    return dayjs(date).startOf('week').toDate();
  }

  /**
   * 이번 주의 끝 시간을 반환합니다
   */
  static endOfWeek(date: Date | string): Date {
    return dayjs(date).endOf('week').toDate();
  }

  /**
   * 이번 달의 시작 시간을 반환합니다
   */
  static startOfMonth(date: Date | string): Date {
    return dayjs(date).startOf('month').toDate();
  }

  /**
   * 이번 달의 끝 시간을 반환합니다
   */
  static endOfMonth(date: Date | string): Date {
    return dayjs(date).endOf('month').toDate();
  }

  /**
   * 오늘인지 확인합니다
   */
  static isToday(date: Date | string): boolean {
    return dayjs(date).isToday();
  }

  /**
   * 어제인지 확인합니다
   */
  static isYesterday(date: Date | string): boolean {
    return dayjs(date).isYesterday();
  }

  /**
   * 날짜가 이전인지 확인합니다
   */
  static isBefore(date1: Date | string, date2: Date | string): boolean {
    return dayjs(date1).isBefore(dayjs(date2));
  }

  /**
   * 날짜가 이후인지 확인합니다
   */
  static isAfter(date1: Date | string, date2: Date | string): boolean {
    return dayjs(date1).isAfter(dayjs(date2));
  }

  /**
   * 날짜가 같은지 확인합니다
   */
  static isSame(date1: Date | string, date2: Date | string, unit: 'day' | 'hour' | 'minute' = 'day'): boolean {
    return dayjs(date1).isSame(dayjs(date2), unit);
  }

  /**
   * 날짜가 범위 내에 있는지 확인합니다
   */
  static isBetween(date: Date | string, start: Date | string, end: Date | string): boolean {
    const target = dayjs(date);
    return target.isSameOrAfter(dayjs(start)) && target.isSameOrBefore(dayjs(end));
  }

  /**
   * 유효한 날짜인지 확인합니다
   */
  static isValid(date: any): boolean {
    return dayjs(date).isValid();
  }

  /**
   * 날짜를 파싱합니다
   */
  static parse(dateString: string, format?: string): Date | null {
    const parsed = format ? dayjs(dateString, format) : dayjs(dateString);
    return parsed.isValid() ? parsed.toDate() : null;
  }

  /**
   * 업무일 관련 유틸리티
   */
  static workingDays = {
    /**
     * 주말인지 확인합니다
     */
    isWeekend(date: Date | string): boolean {
      const day = dayjs(date).day();
      return day === 0 || day === 6; // 일요일(0) 또는 토요일(6)
    },

    /**
     * 평일인지 확인합니다
     */
    isWeekday(date: Date | string): boolean {
      return !this.isWeekend(date);
    },

    /**
     * 다음 평일을 반환합니다
     */
    nextWorkingDay(date: Date | string): Date {
      let next = dayjs(date).add(1, 'day');
      while (this.isWeekend(next.toDate())) {
        next = next.add(1, 'day');
      }
      return next.toDate();
    },

    /**
     * 이전 평일을 반환합니다
     */
    previousWorkingDay(date: Date | string): Date {
      let prev = dayjs(date).subtract(1, 'day');
      while (this.isWeekend(prev.toDate())) {
        prev = prev.subtract(1, 'day');
      }
      return prev.toDate();
    }
  };

  /**
   * 시간 단위 변환 유틸리티
   */
  static duration = {
    /**
     * 밀리초를 시간으로 변환합니다
     */
    fromMilliseconds(ms: number): {
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
    } {
      const duration = dayjs.duration(ms);
      return {
        days: Math.floor(duration.asDays()),
        hours: duration.hours(),
        minutes: duration.minutes(),
        seconds: duration.seconds()
      };
    },

    /**
     * 시간을 밀리초로 변환합니다
     */
    toMilliseconds(days: number = 0, hours: number = 0, minutes: number = 0, seconds: number = 0): number {
      return dayjs.duration({ days, hours, minutes, seconds }).asMilliseconds();
    },

    /**
     * 기간을 사람이 읽기 쉬운 형태로 변환합니다
     */
    humanize(ms: number): string {
      return dayjs.duration(ms).humanize();
    }
  };

  /**
   * 데이터베이스용 포맷 유틸리티
   */
  static database = {
    /**
     * 데이터베이스 timestamp 형식으로 변환합니다
     */
    toTimestamp(date?: Date | string): Date {
      return date ? dayjs(date).toDate() : TimeUtil.now();
    },

    /**
     * 데이터베이스에서 조회할 때 사용할 UTC 날짜를 반환합니다
     */
    toUTC(date: Date | string): Date {
      return dayjs(date).utc().toDate();
    },

    /**
     * 데이터베이스 날짜를 로컬 시간대로 변환합니다
     */
    fromUTC(date: Date | string, timezone: string = TimeUtil.DEFAULT_TIMEZONE): Date {
      return dayjs.utc(date).tz(timezone).toDate();
    }
  };
} 