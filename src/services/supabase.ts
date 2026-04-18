import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if the URL is a placeholder or invalid
const isValidUrl = supabaseUrl && 
                  supabaseUrl.startsWith('http') && 
                  !supabaseUrl.includes('YOUR_SUPABASE_URL');

export const supabase = isValidUrl 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (function createMock(path: string = ''): any {
      return new Proxy(() => {}, {
        get: (_, prop: string) => createMock(`${path}.${prop}`),
        apply: (target, thisArg, args) => {
          console.warn(`Supabase is not configured. Called: supabase${path}`);
          // Return a dummy object that can be destructured for common patterns
          return {
            data: { session: null, subscription: { unsubscribe: () => {} } },
            error: null,
            then: (cb: any) => Promise.resolve(cb({ data: { session: null }, error: null })),
            unsubscribe: () => {}
          };
        }
      });
    })();
