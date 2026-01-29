import { createBrowserClient } from '@supabase/ssr';

// Create a singleton instance to prevent multiple connections
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

// Custom fetch with timeout
const fetchWithTimeout = (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    return fetch(url, {
        ...options,
        signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
};

export function createClient() {
    if (!supabaseClient) {
        console.log('[Supabase] Creating browser client...');
        supabaseClient = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    fetch: fetchWithTimeout,
                },
            }
        );
    }
    return supabaseClient;
}
