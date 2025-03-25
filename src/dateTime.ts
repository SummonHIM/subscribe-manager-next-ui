/**
 * 给 Date 对象增加一个月
 * @param date 要增加一个月的 Date 对象
 * @returns 一个月后的 Date 对象
 */
export function getNextMonth(date: Date | string): Date {
    const oneMonthLater = new Date(date);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    oneMonthLater.setMilliseconds(0); // 去除毫秒
    return oneMonthLater;
}