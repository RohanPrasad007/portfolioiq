import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_URL,
});

let cachedToken = '';

export const setClientToken = (token: string) => {
  cachedToken = token;
};

apiClient.interceptors.request.use(
  async (config) => {
    // If client side, attempt to attach session access token or demo token
    if (typeof window !== 'undefined') {
      const demoToken = window.localStorage.getItem('demo_token');
      const token = demoToken || cachedToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        const session = (await getSession()) as any;
        if (session?.accessToken) {
          cachedToken = session.accessToken;
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('demo_token');
        cachedToken = '';
        await signOut({ callbackUrl: '/login' });
      }
    }
    return Promise.reject(error);
  }
);

export const getServerHeaders = (accessToken?: string) => {
  return {
    headers: {
      Authorization: `Bearer ${accessToken || ''}`,
    },
  };
};

export default apiClient;
