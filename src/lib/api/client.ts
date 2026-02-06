import { useAuthStore } from '@/store/authStore';

export async function apiRequest(method: 'GET' | 'POST', params: any = {}) {
    const storeId = useAuthStore.getState().storeId;

    let url = '/api/sync';
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const payload = { ...params };
    if (storeId && !payload.storeId) {
        payload.storeId = storeId;
    }

    if (method === 'GET') {
        const queryParams = new URLSearchParams();
        Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });
        url += `?${queryParams.toString()}`;
    } else {
        options.body = JSON.stringify(payload);
    }

    try {
        const res = await fetch(url, options);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Server error');
        }

        return data;
    } catch (error: any) {
        throw error;
    }
}
