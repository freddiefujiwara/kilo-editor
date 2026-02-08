import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        include: ["__tests__/**/*.js"]
    },
    coverage: {
        provider: "v8",
        reporter: ["text", "html"]
    }
});
