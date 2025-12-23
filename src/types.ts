export interface FocusTrack {
	id: string;
	name: string;
	url: string;
	duration?: number;
}

export interface GemmySettings {
	idleTalkFrequency: number;
	customAvatarPath?: string;
	focusMusicUrl?: string; // Legacy, kept for migration if needed
	focusDuration: number;
	focusTracks: FocusTrack[];
	position?: { top: number; left: number };
	isRadioMode: boolean;
}

export interface GemmyData {
	settings: GemmySettings;
	quotes: string[];
	favoriteQuotes: string[];
}
