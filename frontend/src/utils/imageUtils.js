export const getImageUrl = (url) => {
    if (!url) return "/placeholder-book.svg";
    if (url.startsWith('http')) return url;

    // Get base API URL but remove /api at the end
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

    // Normalize path: remove leading slash, replace backslashes
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    const normalizedPath = cleanPath.replace(/\\/g, '/');

    return `${apiBase}/${normalizedPath}`;
};
