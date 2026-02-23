import axios from 'axios';
import { BondCalculationResult, BondInput } from '../types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.errors) {
      // Validation errors from express-validator
      const messages = error.response.data.errors.map((e: any) => e.msg).join(', ');
      return Promise.reject(new Error(messages));
    }
    if (error.response?.data?.error?.message) {
      return Promise.reject(new Error(error.response.data.error.message));
    }
    return Promise.reject(new Error('Network error. Please check your connection.'));
  }
);

export async function calculateBond(input: BondInput): Promise<BondCalculationResult> {
  const response = await apiClient.post<{ success: boolean; data: BondCalculationResult }>(
    '/bonds/calculate',
    input
  );
  return response.data.data;
}
