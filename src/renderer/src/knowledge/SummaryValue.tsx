import React from "react";
import { Stack, Text } from "@mantine/core";

export function SummaryValue({ label, value }: { label: string; value: string }): React.JSX.Element {
    return (
        <Stack gap={1}>
            <Text size="xs" c="dimmed">
                {label}
            </Text>
            <Text size="sm" fw={500}>
                {value}
            </Text>
        </Stack>
    );
}
