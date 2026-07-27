import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import { resolve } from "path";

export default defineConfig({
    main: {
        resolve: {
            alias: {
                "@shared": resolve("src/shared")
            }
        }
    },
    preload: {
        resolve: {
            alias: {
                "@shared": resolve("src/shared")
            }
        }
    },
    renderer: {
        resolve: {
            alias: {
                "@renderer": resolve("src/renderer/src"),
                "@shared": resolve("src/shared")
            }
        },
        plugins: [react()]
    }
});
