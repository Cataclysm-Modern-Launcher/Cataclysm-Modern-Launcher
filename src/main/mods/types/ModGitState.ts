export type ModGitState = {
    localCommit: string;
    remoteCommit: string;
    hasUnpushedCommits: boolean;
    updateAvailable: boolean;
};
