export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string | null;
  releaseUrl: string | null;
  releaseNotes: string | null;
  publishedAt: string | null;
}

export interface UpdateState {
  lastCheckTime: number | null;
  dismissedVersion: string | null;
}

export interface UpdateAPI {
  checkForUpdates: () => Promise<UpdateInfo>;
  getUpdateState: () => Promise<UpdateState>;
  dismissUpdate: (version: string) => Promise<void>;
}

// GitHub API response types (subset of what we need)
export interface GitHubRelease {
  tag_name: string;
  html_url: string;
  body: string | null;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
}
