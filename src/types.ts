export interface GemmySettings {
	idleTalkFrequency: number;
	customAvatarPath?: string;
}

export interface GemmyData {
	settings: GemmySettings;
	quotes: string[];
	favoriteQuotes: string[];
}
