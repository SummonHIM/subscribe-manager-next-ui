/**
 * 生成一个月后的 Date 对象
 * @returns 一个月后的 Date 对象
 */
export function getNextMonth(): Date {
    const currentDate = new Date();
    const oneMonthLater = new Date(currentDate);
    oneMonthLater.setMonth(currentDate.getMonth() + 1);
    return oneMonthLater;
}