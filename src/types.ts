export interface GemmySettings {
	idleTalkFrequency: number;
	customAvatarPath?: string;
	focusMusicUrl?: string;
}

export interface GemmyData {
	settings: GemmySettings;
	quotes: string[];
	favoriteQuotes: string[];
}
