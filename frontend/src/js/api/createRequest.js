const createRequest = async (options = {}) => {
    const { url, method = 'GET', data, callback } = options;

    const config = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        if (response.status === 204) {
            if (callback) callback(null, null);
            return null;
        }

        const result = await response.json();
        if (callback) callback(null, result);
        return result;
    } catch (error) {
        console.error('API failure in Cloud Dashboard:', error);
        if (callback) callback(error, null);
        throw error;
    }
};

export default createRequest;
