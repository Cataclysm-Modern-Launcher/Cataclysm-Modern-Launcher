import { ipcRenderer, type IpcRendererEvent } from "electron";
import { Bridge } from "@shared/bridge-api/Bridge";
import { KnowledgeApi } from "@shared/bridge-api/KnowledgeApi";

import { KnowledgeIndexStatus } from "@shared/knowledge/KnowledgeIndexStatus";

export function registerPreloadKnowledgeApi(): KnowledgeApi {
    return {
        open: (worldFolderName) => ipcRenderer.invoke(Bridge.Knowledge.open, worldFolderName),
        getStatus: () => ipcRenderer.invoke(Bridge.Knowledge.getStatus),
        searchItems: (query, limit) => ipcRenderer.invoke(Bridge.Knowledge.searchItems, query, limit),
        getItem: (itemId) => ipcRenderer.invoke(Bridge.Knowledge.getItem, itemId),
        onStatusChanged: (callback) => {
            const listener = (_event: IpcRendererEvent, status: KnowledgeIndexStatus): void => callback(status);
            ipcRenderer.on(Bridge.Knowledge.statusChanged, listener);
            return () => ipcRenderer.removeListener(Bridge.Knowledge.statusChanged, listener);
        }
    };
}
