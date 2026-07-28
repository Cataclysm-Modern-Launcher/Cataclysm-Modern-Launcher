import { is } from "@electron-toolkit/utils";
import { BrowserWindow, nativeTheme } from "electron";
import { join } from "node:path";
import { attachRendererLogging } from "../logger";
import { appSettings } from "../settings/AppSettings";
import { attachWindowStatePersistence, resolveWindowBounds } from "../settings/WindowState";

class KnowledgeWindowService {
    private window: BrowserWindow | null = null;

    open(): void {
        if (this.window !== null && !this.window.isDestroyed()) {
            this.window.focus();
            return;
        }
        const savedWindowState = appSettings.get("knowledgeWindowState");
        const bounds = resolveWindowBounds(savedWindowState.bounds, { width: 1240, height: 820 });
        this.window = new BrowserWindow({
            ...bounds,
            minWidth: 800,
            minHeight: 560,
            show: false,
            autoHideMenuBar: true,
            backgroundColor: nativeTheme.shouldUseDarkColors ? "#141517" : "#f8f9fa",
            webPreferences: { preload: join(__dirname, "../preload/index.js"), sandbox: false }
        });
        attachWindowStatePersistence(this.window, savedWindowState, (state) => appSettings.set({ knowledgeWindowState: state }));
        attachRendererLogging(this.window);
        this.window.once("ready-to-show", () => {
            if (savedWindowState.maximized) this.window?.maximize();
            this.window?.show();
        });
        this.window.on("closed", () => (this.window = null));
        if (is.dev && process.env["ELECTRON_RENDERER_URL"]) void this.window.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}?view=knowledge`);
        else void this.window.loadFile(join(__dirname, "../renderer/index.html"), { query: { view: "knowledge" } });
    }

    send(channel: string, value: unknown): void {
        if (this.window !== null && !this.window.isDestroyed()) this.window.webContents.send(channel, value);
    }
}

export const knowledgeWindowService = new KnowledgeWindowService();
