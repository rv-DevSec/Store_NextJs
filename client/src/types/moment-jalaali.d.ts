declare module 'moment-jalaali' {
  interface MomentJalaali {
    jYear(): number;
    jMonth(): number;
    jDate(): number;
    jDayOfYear(): number;
    jWeekday(): number;
    format(format?: string): string;
    startOf(unit: string): MomentJalaali;
    endOf(unit: string): MomentJalaali;
    add(value: number, unit: string): MomentJalaali;
    subtract(value: number, unit: string): MomentJalaali;
    diff(b: MomentJalaali, unit?: string): number;
    isBefore(b?: MomentJalaali): boolean;
    isAfter(b?: MomentJalaali): boolean;
    clone(): MomentJalaali;
    toISOString(): string;
    valueOf(): number;
    unix(): number;
    isValid(): boolean;
    locale(locale: string): MomentJalaali;
  }

  interface MomentJalaaliStatic {
    (inp?: string | Date | number): MomentJalaali;
    loadPersian(opts?: { dialect?: string; usePersianDigits?: boolean }): void;
  }

  declare const moment: MomentJalaaliStatic;
  export default moment;
}
