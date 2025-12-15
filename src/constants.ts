import { GemmySettings } from "./types";

export const CONSTANTS = {
	BUBBLE_DURATION: 5000,
	DEFAULT_IDLE_FREQUENCY: 5,
};

export const DEFAULT_SETTINGS: GemmySettings = {
	idleTalkFrequency: 5,
	customAvatarPath: "",
};

export const CSS_CLASSES = {
	GEMMY_CONTAINER: "gemmy-container",
	GEMMY_BUBBLE: "gemmy-bubble",
	GEMMY_BUBBLE_CONTENT: "gemmy-bubble-content",
	GEMMY_BUTTON_CONTAINER: "gemmy-button-container",
	TOGGLE_MODE_BUTTON: "gemmy-toggle-mode-button",
	FAVORITE_BUTTON: "gemmy-favorite-button",
	MENU_BUTTON: "gemmy-menu-button",
	NEXT_BUTTON: "gemmy-next-button",
	HIDDEN: "hidden",
	HISTORY_QUOTE_TEXT: "history-quote-text",
	HISTORY_BUTTON_GROUP: "history-button-group",
	HISTORY_COPY_BUTTON: "history-copy-button",
	HISTORY_DELETE_BUTTON: "history-delete-button",
	QUOTE_TEXTAREA: "gemmy-quote-textarea",
};

export const UI_TEXT = {
	ICONS: {
		NORMAL_MODE: "📜",
		FAVORITE_MODE: "⭐",
		HEART_EMPTY: "🤍",
		HEART_FILLED: "❤️",
		MENU: "more-vertical",
		COPY: "copy",
		STAR: "star",
		DOCUMENTS: "documents",
		PLUS_CIRCLE: "plus-circle",
		UPLOAD: "upload",
		DOWNLOAD: "download",
		CLOCK: "clock",
		EYE_OFF: "eye-off",
		IMAGE: "image",
	},
	BUTTONS: {
		PREV: "Prev",
		NEXT: "Next",
		COPY: "Copy",
		REMOVE: "Remove",
		DELETE: "Delete",
		SAVE: "Save",
		RESET: "Reset Default",
	},
	TITLES: {
		FAVORITE_QUOTES: "Favorite Quotes",
		ADD_YOUR_QUOTE: "Add Your Quote",
		ADD_YOUR_QUOTES: "Add Your Quotes",
		ALL_AVAILABLE_QUOTES: "All Available Quotes",
		IMPORT_QUOTES: "Import Quotes",
		CHANGE_IDLE_FREQUENCY: "Change Idle Frequency",
		CHANGE_AVATAR: "Change Avatar Image",
	},
	LABELS: {
		SWITCH_TO_FAV_MODE: "Switch to Favourite Mode",
		SWITCH_TO_NORMAL_MODE: "Switch to Normal Mode",
		MENU: "Menu",
		ENTER_QUOTE_PLACEHOLDER:
			"Enter your quote here. It can span multiple lines.",
		ENTER_QUOTES_NEW_LINE: "Enter each quote on a new line.",
		SELECT_FILE: "Select a JSON or CSV file to import.",
		IDLE_FREQUENCY_NAME: "Idle talk frequency (seconds)",
		IDLE_FREQUENCY_DESC:
			"How often does Gemmy speak when idle, in seconds.",
		AVATAR_URL_NAME: "Avatar URL or Path",
		AVATAR_URL_DESC:
			"Enter a URL (https://...) or a local file path (file://...) for the avatar image. Leave empty to use default.",
	},
	MENU_ITEMS: {
		COPY_CURRENT: "Copy Current Quote",
		VIEW_FAVORITES: "View Favorite Quotes",
		VIEW_ALL: "View All Quotes",
		ADD_NEW: "Add New Quote",
		IMPORT: "Import Quotes",
		EXPORT: "Export Quotes",
		CHANGE_FREQUENCY: "Change Idle Frequency",
		CHANGE_AVATAR: "Change Avatar",
		HIDE_GEMMY: "Hide Gemmy",
	},
};

export const NOTICES = {
	NO_FAVORITES_YET:
		"You haven't favorited any quotes yet! Switching back to Normal Mode.",
	SWITCHED_TO_FAV: "Switched to Favourite Mode",
	SWITCHED_TO_NORMAL: "Switched to Normal Mode",
	REMOVED_FROM_FAVORITES: "Removed from favorites.",
	ADDED_TO_FAVORITES: "Added to favorites!",
	COPIED: "Copied!",
	NEW_QUOTE_SAVED: "New quote saved!",
	QUOTE_EXISTS: "This quote already exists.",
	ALL_QUOTES_EXPORTED: "All quotes exported!",
	NO_MORE_HISTORY: "No more history.",
	QUOTE_CANNOT_BE_EMPTY: "Quote cannot be empty.",
	QUOTE_DELETED: "Quote deleted.",
	FILE_EMPTY: "File is empty or could not be read.",
	ERROR_PARSING: "Error parsing file: ",
	ERROR_READING: "Error reading file.",
	IMPORT_SUCCESS: (count: number) =>
		`Successfully imported ${count} new quote(s).`,
	IMPORT_NO_NEW:
		"No new quotes were imported. They might be duplicates or empty.",
	NEW_QUOTES_SAVED: (count: number) => `${count} new quote(s) saved!`,
	COPIED_SNIPPET: (text: string) => `Copied: "${text.slice(0, 20)}..."`,
};

export const COMMANDS = {
	VIEW_ALL_QUOTES: { id: "view-all-quotes", name: "View all quotes" },
	SHOW_GEMMY: { id: "show", name: "Show Gemmy" },
	EXPORT_ALL_QUOTES: { id: "export-all-quotes", name: "Export all quotes" },
	ADD_QUOTE: { id: "add-quote", name: "Add new quote" },
	VIEW_FAVORITE_QUOTES: {
		id: "view-favorite-quotes",
		name: "View favorite quotes",
	},
	IMPORT_QUOTES: { id: "import-quotes", name: "Import quotes from file" },
};
