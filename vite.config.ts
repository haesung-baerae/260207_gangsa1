import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Vercel 환경 변수도 함께 확인
    const apiKey = env.VITE_API_KEY || 
                   env.GEMINI_API_KEY || 
                   env.API_KEY ||
                   process.env.VITE_API_KEY ||
                   process.env.GEMINI_API_KEY ||
                   process.env.API_KEY;
    
    console.log('Build time - API Key exists:', !!apiKey);
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // import.meta.env를 위한 정의 추가
        'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey),
        // process.env를 위한 정의
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        'process.env.VITE_API_KEY': JSON.stringify(apiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
