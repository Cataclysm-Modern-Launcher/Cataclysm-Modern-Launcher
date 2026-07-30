import { ipcRenderer, type IpcRendererEvent } from "electron";
import { Bridge } from "@shared/bridge-api/Bridge";
import { KnowledgeApi } from "@shared/bridge-api/KnowledgeApi";
import { KnowledgeIndexStatus } from "@shared/knowledge/KnowledgeIndexStatus";

export function registerPreloadKnowledgeApi(): KnowledgeApi {
    return {
        open: (worldFolderName) => ipcRenderer.invoke(Bridge.Knowledge.open, worldFolderName),
        rebuild: () => ipcRenderer.invoke(Bridge.Knowledge.rebuild),
        getStatus: () => ipcRenderer.invoke(Bridge.Knowledge.getStatus),
        searchEntities: (query, category, limit) => ipcRenderer.invoke(Bridge.Knowledge.searchEntities, query, category, limit),
        getEntity: (key) => ipcRenderer.invoke(Bridge.Knowledge.getEntity, key),
        getEntityRelations: (key) => ipcRenderer.invoke(Bridge.Knowledge.getEntityRelations, key),
        getEntityRelationsBatch: (keys) => ipcRenderer.invoke(Bridge.Knowledge.getEntityRelationsBatch, keys),
        onStatusChanged: (callback) => {
            const listener = (_event: IpcRendererEvent, status: KnowledgeIndexStatus): void => callback(status);
            ipcRenderer.on(Bridge.Knowledge.statusChanged, listener);
            return () => ipcRenderer.removeListener(Bridge.Knowledge.statusChanged, listener);
        }
    };
}
