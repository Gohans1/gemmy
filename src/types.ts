export interface FocusTrack {
	id: string;
	name: string;
	url: string;
}

export interface GemmySettings {
	idleTalkFrequency: number;
	customAvatarPath?: string;
	focusMusicUrl?: string; // Legacy, kept for migration if needed
	focusDuration: number;
	focusTracks: FocusTrack[];
	position?: { top: number; left: number };
}

export interface GemmyData {
	settings: GemmySettings;
	quotes: string[];
	favoriteQuotes: string[];
}
