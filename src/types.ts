export interface GemmySettings {
	idleTalkFrequency: number;
}

export interface GemmyData {
	settings: GemmySettings;
	quotes: string[];
	favoriteQuotes: string[];
}
