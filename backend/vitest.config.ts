import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
        exclude: ['node_modules', 'dist', 'coverage'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            exclude: ['node_modules', 'dist', 'coverage', 'src/types', 'src/index.ts'],
        },
    },
});