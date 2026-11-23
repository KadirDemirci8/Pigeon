import axios from 'axios'

// The session JWT is HttpOnly: JavaScript must never read or store it.
axios.defaults.withCredentials = true

const API_BASE = 'https://localhost:7151'
let csrfToken = null
let csrfPromise = null

export function clearCsrfToken() {
    csrfToken = null
    csrfPromise = null
}

async function getCsrfToken() {
    if (csrfToken) return csrfToken
    if (!csrfPromise) {
        csrfPromise = axios.get(`${API_BASE}/api/auth/csrf`)
            .then(response => {
                csrfToken = response.data.requestToken
                return csrfToken
            })
            .finally(() => { csrfPromise = null })
    }
    return csrfPromise
}

axios.interceptors.request.use(async config => {
    const method = (config.method || 'get').toLowerCase()
    const unsafe = ['post', 'put', 'patch', 'delete'].includes(method)
    const url = config.url || ''
    if (unsafe && (url.startsWith(API_BASE) || url.startsWith('/api/'))) {
        const csrf = await getCsrfToken()
        config.headers.set('X-CSRF-TOKEN', csrf)
    }
    return config
})

// CSRF request tokens can be bound to the authenticated principal.
// After a successful login we must request a fresh one before the next mutation.
axios.interceptors.response.use(response => {
    if (/\/api\/auth\/(login|logout)(?:\?|$)/i.test(response.config?.url || '')) {
        clearCsrfToken()
    }
    return response
})
