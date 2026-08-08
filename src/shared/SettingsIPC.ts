import { TAutoBackupLimit } from "./backups/types/TAutoBackupLimit";
import { TBackupRotationLimit } from "./backups/types/TBackupRotationLimit";
import { TAutoBackupCooldown } from "./backups/types/TAutoBackupCooldown";

export type SettingsIPC = {
    backupsEnabled: boolean;
    autoBackupLimit: TAutoBackupLimit;
    manualBackupRotationLimit: TBackupRotationLimit;
    autoBackupCooldown: TAutoBackupCooldown;
};

export type SettingsIPCSetter = {
    setBackupsEnabled: (value: boolean) => Promise<SettingsIPC>;
    setAutoBackupLimit: (value: TAutoBackupLimit) => Promise<SettingsIPC>;
    setAutoBackupCooldown: (value: TAutoBackupCooldown) => Promise<SettingsIPC>;
    setManualBackupRotationLimit: (value: TBackupRotationLimit) => Promise<SettingsIPC>;
};
