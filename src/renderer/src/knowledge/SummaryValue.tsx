import React, { ReactNode } from "react";
import { Stack, Text } from "@mantine/core";

type SummaryValueContent = string | ReactNode | readonly (string | ReactNode)[] | null;

interface SummaryValueProps {
    label: string;
    value: SummaryValueContent;
}

export function SummaryValue({ label, value }: SummaryValueProps): React.JSX.Element | null {
    const values = Array.isArray(value) ? value : [value];
    if (values.length === 0 || values.every((item) => !item)) return null;

    return (
        <Stack gap={2}>
            <Text size="xs" c="dimmed">
                {label}
            </Text>

            <Stack gap={4}>
                {values.map((item, index) =>
                    typeof item === "string" ? (
                        <Text key={index} size="sm" fw={500}>
                            {item}
                        </Text>
                    ) : (
                        <React.Fragment key={index}>{item}</React.Fragment>
                    )
                )}
            </Stack>
        </Stack>
    );
}
