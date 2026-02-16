export const getImageUrl = (url) => {
    if (!url || url === 'null' || url === 'undefined') return "/placeholder-book.svg";
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;

    // Normalize path: remove leading slash, replace backslashes
    let cleanPath = url.replace(/\\/g, '/');
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);

    // In production (Render), everything is on the same domain
    // We should use a relative path starting with /
    if (import.meta.env.PROD) {
        return `/${cleanPath}`;
    }

    // In development, we might need the full backend URL
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
    return `${apiBase}/${cleanPath}`;
};
