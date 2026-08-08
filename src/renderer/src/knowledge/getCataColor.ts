const CATA_COLORS: Readonly<Record<string, string>> = {
    black: "#000000",
    dark_gray: "#555555",
    light_gray: "#aaaaaa",
    white: "#ffffff",
    red: "#aa0000",
    light_red: "#ff5555",
    green: "#00aa00",
    light_green: "#55ff55",
    brown: "#aa5500",
    yellow: "#ffff55",
    blue: "#0000aa",
    light_blue: "#5555ff",
    magenta: "#aa00aa",
    pink: "#ff55ff",
    cyan: "#00aaaa",
    light_cyan: "#55ffff"
};

export function getCataColor(value: string | null): string | undefined {
    if (value === null) return undefined;
    return CATA_COLORS[value.replace(/^c_/, "")];
}
