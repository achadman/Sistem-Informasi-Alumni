import PocketBase from 'pocketbase';

// Connect to local PocketBase
export const pb = new PocketBase(import.meta.env.VITE_PB_URL);
