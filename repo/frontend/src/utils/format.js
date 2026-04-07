import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
export function formatDate(date, pattern = 'MMM d, yyyy') {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsed))
        return '—';
    return format(parsed, pattern);
}
export function formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}
export function formatPercent(value, decimals = 1) {
    return `${(value * 100).toFixed(decimals)}%`;
}
export function formatRelativeTime(date) {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsed))
        return '—';
    return formatDistanceToNow(parsed, { addSuffix: true });
}
export function timeAgo(date) {
    return formatRelativeTime(date);
}
