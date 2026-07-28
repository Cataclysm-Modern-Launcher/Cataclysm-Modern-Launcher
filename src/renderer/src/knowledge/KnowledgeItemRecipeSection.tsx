import React from "react";
import { Box, Divider, Stack } from "@mantine/core";

export function KnowledgeItemRecipeSection({ title, children }: React.PropsWithChildren<{ title: string }>): React.JSX.Element {
    return (
        <Stack gap="xs">
            <Divider label={title} labelPosition="left" />
            <Box>{children}</Box>
        </Stack>
    );
}
