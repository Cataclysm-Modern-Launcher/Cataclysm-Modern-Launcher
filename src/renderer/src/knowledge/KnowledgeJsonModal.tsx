import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { Group, Modal, Switch } from "@mantine/core";
import CodeMirror from "@uiw/react-codemirror";
import { useAppearanceStore } from "@renderer/stores/useAppearanceStore";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import React, { useMemo, useState } from "react";
import { formatKnowledgeJson } from "./formatKnowledgeJson";

const JSON_FORMAT_STORAGE_KEY = "knowledge.json.use-game-format";

export type KnowledgeJsonModalProps = {
    opened: boolean;
    value: unknown;
    onClose: () => void;
};

export function KnowledgeJsonModal(props: KnowledgeJsonModalProps): React.JSX.Element {
    const t = useTranslate();
    const theme = useAppearanceStore((state) => state.theme);
    const [useGameFormatting, setUseGameFormatting] = useState(readUseGameFormatting);
    const source = useMemo(() => (useGameFormatting ? formatKnowledgeJson(props.value) : (JSON.stringify(props.value, null, 4) ?? "undefined")), [props.value, useGameFormatting]);

    const handleFormattingChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const nextValue = event.currentTarget.checked;
        setUseGameFormatting(nextValue);
        writeUseGameFormatting(nextValue);
    };

    return (
        <Modal
            opened={props.opened}
            onClose={props.onClose}
            title={
                <Group gap="sm" wrap="nowrap">
                    {t("knowledge.entity.raw.json.title")}
                    <Switch checked={useGameFormatting} onChange={handleFormattingChange} onLabel="CDDA" offLabel="JSON" size="md" aria-label="JSON formatting style" />
                </Group>
            }
            size="90vw"
            centered
        >
            <CodeMirror
                value={source}
                height="70vh"
                extensions={[json()]}
                theme={theme === "dark" ? oneDark : "light"}
                editable={false}
                readOnly
                basicSetup={{
                    foldGutter: true,
                    highlightActiveLine: false,
                    highlightActiveLineGutter: false
                }}
                style={{
                    fontSize: 14
                }}
            />
        </Modal>
    );
}

function readUseGameFormatting(): boolean {
    try {
        return localStorage.getItem(JSON_FORMAT_STORAGE_KEY) !== "false";
    } catch {
        return true;
    }
}

function writeUseGameFormatting(value: boolean): void {
    try {
        localStorage.setItem(JSON_FORMAT_STORAGE_KEY, String(value));
    } catch {
        // The current renderer session still keeps the selected value in React state.
    }
}
