const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
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
