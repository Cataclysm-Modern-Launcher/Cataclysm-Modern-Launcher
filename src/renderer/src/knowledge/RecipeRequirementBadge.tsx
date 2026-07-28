import React from "react";
import { Badge, Text, Tooltip, UnstyledButton } from "@mantine/core";

export function RecipeRequirementBadge({ itemId, name, countText, onNavigate }: { itemId: string; name: string; countText: string; onNavigate: (itemId: string) => void }): React.JSX.Element {
    return (
        <Tooltip label={name} openDelay={350}>
            <UnstyledButton onClick={() => onNavigate(itemId)} style={{ minWidth: 0, maxWidth: "100%" }}>
                <Badge variant="light" size="lg" tt="none" maw="100%">
                    <Text span truncate>
                        {countText.length > 0 ? `${countText} ` : ""}
                        {name}
                    </Text>
                </Badge>
            </UnstyledButton>
        </Tooltip>
    );
}
