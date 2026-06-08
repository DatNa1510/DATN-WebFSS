/**
 * API Configuration
 * - Development: http://localhost:8080  (từ .env.development)
 * - Production:  https://datn-webfss.onrender.com (từ .env.production)
 */
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
