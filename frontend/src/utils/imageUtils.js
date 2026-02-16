export const getImageUrl = (url) => {
    if (!url) return "/placeholder-book.svg";
    if (url.startsWith('http')) return url;

    // Get base API URL
    let apiBase = import.meta.env.VITE_API_URL;

    if (!apiBase) {
        if (import.meta.env.PROD) {
            // In production, use current origin
            apiBase = window.location.origin;
        } else {
            // In development, default to localhost
            apiBase = 'http://localhost:5000';
        }
    } else {
        // Remove /api if present at the end
        apiBase = apiBase.replace(/\/api$/, '');
    }

    // Normalize path: remove leading slash, replace backslashes
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    const normalizedPath = cleanPath.replace(/\\/g, '/');

    return `${apiBase}/${normalizedPath}`;
};
