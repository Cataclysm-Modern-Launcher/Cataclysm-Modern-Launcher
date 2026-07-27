import { ipcRenderer } from "electron";
import { ShellApi } from "@shared/bridge-api/ShellApi";
import { Bridge } from "@shared/bridge-api/Bridge";

export function registerPreloadShellApi(): ShellApi {
    return {
        openExternal: (url: string): Promise<boolean> => ipcRenderer.invoke(Bridge.Shell.openExternal, url)
    };
}
