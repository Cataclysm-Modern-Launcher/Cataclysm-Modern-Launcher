import { lstat, mkdir, readlink, rename, rm, symlink } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

import { ModInfo } from "@shared/mods/ModInfo";
import { isNodeError } from "../utils/isNodeError";

const ModIdRegex = /[^a-zA-Z0-9._-]/g;

interface SynchronizeOptions {
    replaceConflicts?: boolean;
}

class ModAttachmentService {
    async synchronize(userdataPaths: string[], mods: ModInfo[], getSourcePath: (mod: ModInfo) => string, options: SynchronizeOptions = {}): Promise<void> {
        for (const userdataPath of userdataPaths) {
            for (const mod of mods) {
                if (!mod.enabled) continue;
                await this.ensureAttached(userdataPath, mod, getSourcePath(mod), options);
            }
        }
    }

    async detach(userdataPaths: string[], mod: ModInfo): Promise<void> {
        for (const userdataPath of userdataPaths) {
            await this.removeManagedLink(this.getAttachmentPath(userdataPath, mod));
        }
    }

    private async ensureAttached(userdataPath: string, mod: ModInfo, sourcePath: string, options: SynchronizeOptions): Promise<void> {
        const attachmentPath = this.getAttachmentPath(userdataPath, mod);
        await mkdir(dirname(attachmentPath), { recursive: true });

        const status = await this.inspectLink(attachmentPath, sourcePath);
        if (status === "correct") return;
        if (status === "conflict" && !options.replaceConflicts) {
            console.warn(`[mods] attachment path is occupied by a real file or directory: ${attachmentPath}`);
            return;
        }

        if (status === "wrong-link") await rm(attachmentPath, { recursive: true, force: true });

        const target = process.platform === "win32" ? resolve(sourcePath) : relative(dirname(attachmentPath), sourcePath);
        if (status !== "conflict") {
            await symlink(target, attachmentPath, process.platform === "win32" ? "junction" : "dir");
            return;
        }

        const displacedPath = `${attachmentPath}.launcher-replaced-${process.pid}-${Date.now()}`;
        await rename(attachmentPath, displacedPath);
        try {
            await symlink(target, attachmentPath, process.platform === "win32" ? "junction" : "dir");
            await rm(displacedPath, { recursive: true, force: true });
            console.info(`[mods] replaced copied attachment with a directory link: ${attachmentPath}`);
        } catch (error) {
            await rm(attachmentPath, { recursive: true, force: true });
            await rename(displacedPath, attachmentPath);
            throw error;
        }
    }

    private async inspectLink(attachmentPath: string, sourcePath: string): Promise<"missing" | "correct" | "wrong-link" | "conflict"> {
        try {
            const info = await lstat(attachmentPath);
            if (!info.isSymbolicLink()) return "conflict";

            const linkedTarget = await readlink(attachmentPath);
            const resolvedTarget = resolve(dirname(attachmentPath), linkedTarget);
            return resolvedTarget === resolve(sourcePath) ? "correct" : "wrong-link";
        } catch (error) {
            if (isNodeError(error) && error.code === "ENOENT") return "missing";
            throw error;
        }
    }

    private async removeManagedLink(attachmentPath: string): Promise<void> {
        try {
            if ((await lstat(attachmentPath)).isSymbolicLink()) {
                await rm(attachmentPath, { force: true });
            }
        } catch (error) {
            if (!isNodeError(error) || error.code !== "ENOENT") throw error;
        }
    }

    private getAttachmentPath(userdataPath: string, mod: ModInfo): string {
        return join(userdataPath, "mods", mod.id.replace(ModIdRegex, "_"));
    }
}

export const modAttachmentService = new ModAttachmentService();
