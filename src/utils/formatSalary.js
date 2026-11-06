/**
 * Salary formatter util
 * Turns { min, max, currency, period } into:
 * - "$80,000 – $100,000 a year"
 * - "From $25 an hour"
 * - "Up to $5,000 a month"
 * - handles missing salary by showing nothing.
 */
export const formatSalary = (salaryOrJob) => {
    if (!salaryOrJob) return "";

    // If an entire job object was passed
    const salary = salaryOrJob.salary || (typeof salaryOrJob === "object" && (salaryOrJob.min || salaryOrJob.max) ? salaryOrJob : null);

    if (typeof salaryOrJob === "string") {
        return salaryOrJob;
    }

    if (!salary) {
        if (salaryOrJob.rate) return salaryOrJob.rate;
        return "";
    }

    const min = Number(salary.min) || 0;
    const max = Number(salary.max) || 0;
    const currencySymbol = salary.currency === "EUR" ? "€" : salary.currency === "GBP" ? "£" : "$";
    
    let period = salary.period || "year";
    if (period.startsWith("Per ")) {
        period = period.replace("Per ", "").toLowerCase();
    }
    if (period === "annum") period = "year";

    const formatNum = (num) => num.toLocaleString();

    if (min > 0 && max > 0) {
        if (min === max) {
            return `${currencySymbol}${formatNum(min)} a ${period}`;
        }
        return `${currencySymbol}${formatNum(min)} – ${currencySymbol}${formatNum(max)} a ${period}`;
    }

    if (min > 0 && max === 0) {
        return `From ${currencySymbol}${formatNum(min)} a ${period}`;
    }

    if (max > 0 && min === 0) {
        return `Up to ${currencySymbol}${formatNum(max)} a ${period}`;
    }

    return "";
};

export default formatSalary;
