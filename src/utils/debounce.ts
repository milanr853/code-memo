export function debounce(fn: () => void, delay = 500) {
    let timer: NodeJS.Timeout | undefined;
    return () => {
        clearTimeout(timer);
        timer = setTimeout(fn, delay);
    };
}
