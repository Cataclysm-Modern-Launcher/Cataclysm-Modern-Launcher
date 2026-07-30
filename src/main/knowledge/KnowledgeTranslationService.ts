import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "jsonc-parser";
import { isRecord } from "@shared/utils/isRecord";

export class KnowledgeTranslationService {
    private language = "en";
    private readonly translations = new Map<string, string>();

    get hasTranslation(): boolean {
        return this.language !== "en" && this.translations.size > 0;
    }

    getLanguage(): string {
        return this.language;
    }

    async load(bundlePath: string, userdataPath: string): Promise<void> {
        this.translations.clear();
        this.language = await resolveGameLanguage(userdataPath);
        if (this.language === "en") return;

        const directories = [join(bundlePath, "lang", "mo", this.language, "LC_MESSAGES"), join(bundlePath, "share", "locale", this.language, "LC_MESSAGES"), join(userdataPath, "mods")];
        for (const directory of directories) await this.loadFromDirectory(directory);
        console.info(`[knowledge:i18n] language=${this.language} entries=${this.translations.size}`);
    }

    translate(value: string, context?: string): string {
        if (this.language === "en") return value;
        if (context !== undefined) {
            const contextual = this.translations.get(`${context}\u0004${value}`);
            if (contextual !== undefined) return contextual;
        }
        return this.translations.get(value) ?? value;
    }

    translateValue(value: unknown): unknown {
        if (typeof value === "string") return this.translate(value);
        if (Array.isArray(value)) return value.map((item) => this.translateValue(item));
        if (!isRecord(value)) return value;

        const context = typeof value.ctxt === "string" ? value.ctxt : undefined;
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => {
                if ((key === "str" || key === "str_sp" || key === "str_pl") && typeof item === "string") return [key, this.translate(item, context)];
                return [key, this.translateValue(item)];
            })
        );
    }

    private async loadFromDirectory(directory: string): Promise<void> {
        if (!existsSync(directory)) return;
        const entries = await readdir(directory, { withFileTypes: true, recursive: true });
        for (const entry of entries) {
            if (!entry.isFile() || !entry.name.endsWith(".mo")) continue;
            const parentPath = entry.parentPath ?? directory;
            const normalized = parentPath.replaceAll("\\", "/");
            if (!normalized.endsWith(`/${this.language}/LC_MESSAGES`)) continue;
            this.loadMo(await readFile(join(parentPath, entry.name)));
        }
    }

    private loadMo(buffer: Buffer): void {
        if (buffer.length < 28) return;
        const littleMagic = buffer.readUInt32LE(0);
        const littleEndian = littleMagic === 0x950412de;
        if (!littleEndian && buffer.readUInt32BE(0) !== 0x950412de) return;
        const readUInt32 = (offset: number): number => (littleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset));
        const count = readUInt32(8);
        const originalTable = readUInt32(12);
        const translatedTable = readUInt32(16);
        for (let index = 0; index < count; index += 1) {
            const originalLength = readUInt32(originalTable + index * 8);
            const originalOffset = readUInt32(originalTable + index * 8 + 4);
            const translatedLength = readUInt32(translatedTable + index * 8);
            const translatedOffset = readUInt32(translatedTable + index * 8 + 4);
            if (originalLength === 0 || translatedLength === 0) continue;
            const original = buffer.toString("utf8", originalOffset, originalOffset + originalLength).split("\u0000", 1)[0];
            const translated = buffer.toString("utf8", translatedOffset, translatedOffset + translatedLength).split("\u0000", 1)[0];
            if (original.length > 0 && translated.length > 0) this.translations.set(original, translated);
        }
    }
}

async function resolveGameLanguage(userdataPath: string): Promise<string> {
    try {
        const options = parse(await readFile(join(userdataPath, "config", "options.json"), "utf8")) as unknown;
        if (Array.isArray(options)) {
            const useLang = options.find((option) => isRecord(option) && option.name === "USE_LANG");
            if (isRecord(useLang) && typeof useLang.value === "string" && useLang.value.length > 0) return useLang.value;
        }
    } catch (error) {
        console.warn("[knowledge:i18n] failed to read options.json", error);
    }
    return resolveSystemLanguage();
}

function resolveSystemLanguage(): string {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.replace("-", "_");
    const supported = ["en", "ar", "cs", "da", "de", "el", "es_AR", "es_ES", "fr", "hu", "id", "is", "it_IT", "ja", "ko", "nb", "nl", "pl", "pt", "pt_BR", "ru", "sr", "tr", "uk_UA", "zh_CN", "zh_TW"];
    return supported.find((language) => locale === language || locale.startsWith(`${language}_`) || locale.startsWith(language)) ?? "en";
}
