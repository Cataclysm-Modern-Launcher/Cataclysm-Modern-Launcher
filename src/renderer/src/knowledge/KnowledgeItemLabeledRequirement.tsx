import React from "react";
import { Box, Text } from "@mantine/core";

export function KnowledgeItemLabeledRequirement({ label, children }: React.PropsWithChildren<{ label: string }>): React.JSX.Element {
    return (
        <Box style={{ display: "grid", gridTemplateColumns: "150px minmax(0, 1fr)", alignItems: "start", columnGap: 16 }}>
            <Text size="sm" c="dimmed">
                {label}
            </Text>
            <Box miw={0}>{children}</Box>
        </Box>
    );
}
