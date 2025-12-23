import {
	App,
	Modal,
	Notice,
	Setting,
	ButtonComponent,
	TextComponent,
} from "obsidian";
import { DataManager } from "./DataManager";
import { UI_TEXT, NOTICES, CSS_CLASSES } from "./constants";

abstract class BaseGemmyModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		this.contentEl.empty();
		this.contentEl.addClass("gemmy-modal");
	}

	onClose() {
		this.contentEl.empty();
	}

	protected setModalTitle(title: string) {
		this.contentEl.createEl("h2", { text: title });
	}
}

export class FocusSettingsModal extends BaseGemmyModal {
	dataManager: DataManager;
	onSelectMusic: (videoId: string) => void;

	constructor(
		app: App,
		dataManager: DataManager,
		onSelectMusic: (videoId: string) => void,
	) {
		super(app);
		this.dataManager = dataManager;
		this.onSelectMusic = onSelectMusic;
	}

	onOpen() {
		super.onOpen();
		this.setModalTitle("Focus Mode Settings");
		const { contentEl } = this;

		// --- RADIO MODE TOGGLE ---
		new Setting(contentEl)
			.setName("Radio Mode (10s segments)")
			.setDesc("Play a random 10-second segment from each track.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.dataManager.settings.isRadioMode)
					.onChange(async (value) => {
						await this.dataManager.updateSettings({
							isRadioMode: value,
						});
					}),
			);

		// --- LIBRARY MANAGER ---
		contentEl.createEl("h3", { text: "Library Manager" });
		contentEl.createEl("p", {
			text: "Manage your Focus Mode tracks.",
			cls: "setting-item-description",
		});

		const libraryContainer = contentEl.createDiv(
			"gemmy-modal-playlist gemmy-playlist-container",
		);
		this.renderLibrary(libraryContainer);

		// --- ADD NEW TRACK ---
		contentEl.createEl("h4", { text: "Add New Track" });
		const addTrackDiv = contentEl.createDiv(
			"gemmy-playlist-add-row",
		);

		const trackNameInput = new TextComponent(addTrackDiv).setPlaceholder(
			"Track Name",
		);
		trackNameInput.inputEl.addClass("gemmy-flex-1");

		const trackUrlInput = new TextComponent(addTrackDiv).setPlaceholder(
			"YouTube Video URL",
		);
		trackUrlInput.inputEl.addClass("gemmy-flex-2");

		new ButtonComponent(addTrackDiv)
			.setButtonText("Add Track")
			.setCta()
			.onClick(async () => {
				const name = trackNameInput.getValue().trim();
				const url = trackUrlInput.getValue().trim();
				if (!name || !url) {
					new Notice("Enter both name and URL");
					return;
				}

				const id = this.extractYouTubeId(url);
				if (!id) {
					new Notice("Invalid YouTube Video URL");
					return;
				}

				const currentTracks =
					this.dataManager.settings.focusTracks || [];
				await this.dataManager.updateSettings({
					focusTracks: [...currentTracks, { name, url, id }],
				});
				new Notice("Track added!");
				trackNameInput.setValue("");
				trackUrlInput.setValue("");
				this.renderLibrary(libraryContainer);
			});
	}

	renderLibrary(container: HTMLElement) {
		container.empty();

		// --- RENDER TRACKS ---
		container.createEl("h5", {
			text: "Tracks",
			cls: "gemmy-library-header",
		});
		const tracks = this.dataManager.settings.focusTracks || [];

		if (tracks.length === 0) {
			container.createEl("div", {
				text: "No individual tracks yet.",
				cls: "setting-item-description gemmy-empty-message",
			});
		} else {
			tracks.forEach((track, index) => {
				const item = container.createDiv(
					"gemmy-playlist-item",
				);

				// Play Click
				const info = item.createDiv({
					cls: "gemmy-flex-1 gemmy-cursor-pointer",
				});
				const nameEl = info.createDiv({
					text: track.name,
				});
				nameEl.style.fontWeight = "bold";

				const durationText = track.duration ? ` (${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")})` : "";
				const typeEl = info.createDiv({
					text: `Track${durationText}`,
				});
				typeEl.style.fontSize = "0.8em";
				typeEl.style.color = "var(--text-muted)";

				info.onclick = () => {
					this.onSelectMusic(track.id);
					this.close();
				};

				// Controls
				const controls = item.createDiv({
					cls: "gemmy-playlist-item-controls",
				});

				// Move Up
				if (index > 0) {
					const moveUpBtn = new ButtonComponent(controls)
						.setIcon("arrow-up")
						.onClick(async () => {
							const newTracks = [...tracks];
							[newTracks[index - 1], newTracks[index]] = [
								newTracks[index],
								newTracks[index - 1],
							];
							await this.dataManager.updateSettings({
								focusTracks: newTracks,
							});
							this.renderLibrary(container);
						});
					moveUpBtn.buttonEl.setAttribute("aria-label", "Move Up");
					moveUpBtn.buttonEl.addClass("clickable-icon");
				}

				// Delete
				const delBtn = new ButtonComponent(controls)
					.setIcon("trash")
					.onClick(async () => {
						const newTracks = tracks.filter((_, i) => i !== index);
						await this.dataManager.updateSettings({
							focusTracks: newTracks,
						});
						this.renderLibrary(container);
					});
				delBtn.buttonEl.setAttribute("aria-label", "Delete");
				delBtn.buttonEl.addClass("clickable-icon");
				delBtn.buttonEl.addClass("mod-warning");
			});
		}
	}

	extractYouTubeId(url: string): string | null {
		url = url.trim();
		if (url.length === 11 && !url.includes("/") && !url.includes("?")) {
			return url;
		}
		const regExp =
			/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
		const match = url.match(regExp);
		return match && match[2].length === 11 ? match[2] : null;
	}
}

export class ViewFavoritesModal extends BaseGemmyModal {
	dataManager: DataManager;

	constructor(app: App, dataManager: DataManager) {
		super(app);
		this.dataManager = dataManager;
	}

	onOpen() {
		super.onOpen();
		this.setModalTitle(UI_TEXT.TITLES.FAVORITE_QUOTES);
		const { contentEl } = this;

		if (this.dataManager.favoriteQuotes.length === 0) {
			contentEl.createEl("p", { text: "No favorite quotes yet." });
			return;
		}

		const listEl = contentEl.createEl("ol");
		for (const quote of this.dataManager.favoriteQuotes) {
			const listItemEl = listEl.createEl("li");
			listItemEl.createDiv({
				text: quote,
				cls: CSS_CLASSES.HISTORY_QUOTE_TEXT,
			});

			const buttonGroup = listItemEl.createDiv({
				cls: CSS_CLASSES.HISTORY_BUTTON_GROUP,
			});

			const copyBtn = buttonGroup.createEl("button", {
				text: UI_TEXT.BUTTONS.COPY,
				cls: CSS_CLASSES.HISTORY_COPY_BUTTON,
			});
			copyBtn.onclick = () => {
				navigator.clipboard.writeText(quote).then(() => {
					new Notice(NOTICES.COPIED_SNIPPET(quote));
				});
			};

			const removeBtn = buttonGroup.createEl("button", {
				text: UI_TEXT.BUTTONS.REMOVE,
				cls: CSS_CLASSES.HISTORY_DELETE_BUTTON,
			});
			removeBtn.onclick = async () => {
				const success =
					await this.dataManager.removeFromFavorites(quote);
				if (success) {
					new Notice(NOTICES.REMOVED_FROM_FAVORITES);
					this.onOpen(); // Refresh list
				}
			};
		}
	}
}

export class AddUserQuoteModal extends BaseGemmyModal {
	onSubmit: (quote: string) => void;
	constructor(app: App, onSubmit: (quote: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}
	onOpen() {
		super.onOpen();
		this.setModalTitle(UI_TEXT.TITLES.ADD_YOUR_QUOTE);
		const { contentEl } = this;

		const textarea = contentEl.createEl("textarea", {
			cls: CSS_CLASSES.QUOTE_TEXTAREA,
			placeholder: UI_TEXT.LABELS.ENTER_QUOTE_PLACEHOLDER,
		});
		textarea.rows = 10;
		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText(UI_TEXT.BUTTONS.SAVE)
				.setCta()
				.onClick(() => {
					const quote = textarea.value.trim();
					if (quote) {
						this.onSubmit(quote);
						this.close();
					} else {
						new Notice(NOTICES.QUOTE_CANNOT_BE_EMPTY);
					}
				}),
		);
	}
}

export class AddQuoteModal extends BaseGemmyModal {
	onSubmit: (quotes: string[]) => void;
	constructor(app: App, onSubmit: (quotes: string[]) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}
	onOpen() {
		super.onOpen();
		this.setModalTitle(UI_TEXT.TITLES.ADD_YOUR_QUOTES);
		const { contentEl } = this;

		contentEl.createEl("p", { text: UI_TEXT.LABELS.ENTER_QUOTES_NEW_LINE });
		const textarea = contentEl.createEl("textarea", {
			cls: CSS_CLASSES.QUOTE_TEXTAREA,
		});
		textarea.rows = 10;
		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText(UI_TEXT.BUTTONS.SAVE)
				.setCta()
				.onClick(() => {
					const quotes = textarea.value
						.split("\n")
						.filter((line) => line.trim() !== "");
					this.onSubmit(quotes);
					this.close();
				}),
		);
	}
}

export class ViewAllQuotesModal extends BaseGemmyModal {
	dataManager: DataManager;
	listEl: HTMLElement;
	searchTerm = "";

	constructor(app: App, dataManager: DataManager) {
		super(app);
		this.dataManager = dataManager;
	}

	onOpen() {
		super.onOpen();
		this.setModalTitle(UI_TEXT.TITLES.ALL_AVAILABLE_QUOTES);
		const { contentEl } = this;

		if (this.dataManager.allQuotes.length === 0) {
			contentEl.createEl("p", { text: "No quotes available." });
			return;
		}

		// Search Bar
		new Setting(contentEl).setName("Search Quotes").addSearch((search) => {
			search
				.setPlaceholder("Search...")
				.setValue(this.searchTerm)
				.onChange((value) => {
					this.searchTerm = value.toLowerCase();
					this.renderList();
				});
		});

		this.listEl = contentEl.createEl("ol");
		this.renderList();
	}

	renderList() {
		this.listEl.empty();
		const filteredQuotes = this.dataManager.allQuotes.filter((q) =>
			q.toLowerCase().includes(this.searchTerm),
		);

		for (const quote of filteredQuotes) {
			const listItemEl = this.listEl.createEl("li");
			listItemEl.createDiv({
				text: quote,
				cls: CSS_CLASSES.HISTORY_QUOTE_TEXT,
			});

			const buttonGroup = listItemEl.createDiv({
				cls: CSS_CLASSES.HISTORY_BUTTON_GROUP,
			});

			const isFav = this.dataManager.isFavorite(quote);
			const favBtn = buttonGroup.createEl("button", {
				text: isFav
					? UI_TEXT.ICONS.HEART_FILLED
					: UI_TEXT.ICONS.HEART_EMPTY,
				cls: CSS_CLASSES.HISTORY_COPY_BUTTON,
			});
			favBtn.setAttribute(
				"aria-label",
				isFav ? "Remove from Favorites" : "Add to Favorites",
			);
			favBtn.onclick = async () => {
				const added = await this.dataManager.toggleFavorite(quote);
				if (added) {
					favBtn.innerText = UI_TEXT.ICONS.HEART_FILLED;
					favBtn.setAttribute("aria-label", "Remove from Favorites");
					new Notice(NOTICES.ADDED_TO_FAVORITES);
				} else {
					favBtn.innerText = UI_TEXT.ICONS.HEART_EMPTY;
					favBtn.setAttribute("aria-label", "Add to Favorites");
					new Notice(NOTICES.REMOVED_FROM_FAVORITES);
				}
			};

			const copyBtn = buttonGroup.createEl("button", {
				text: UI_TEXT.BUTTONS.COPY,
				cls: CSS_CLASSES.HISTORY_COPY_BUTTON,
			});
			copyBtn.onclick = () => {
				navigator.clipboard.writeText(quote).then(() => {
					new Notice(NOTICES.COPIED_SNIPPET(quote));
				});
			};

			const deleteBtn = buttonGroup.createEl("button", {
				text: UI_TEXT.BUTTONS.DELETE,
				cls: CSS_CLASSES.HISTORY_DELETE_BUTTON,
			});
			deleteBtn.onclick = async () => {
				const success = await this.dataManager.removeQuote(quote);
				if (success) {
					new Notice(NOTICES.QUOTE_DELETED);
					this.renderList();
				}
			};
		}
	}
}

export class ImportModal extends BaseGemmyModal {
	dataManager: DataManager;

	constructor(app: App, dataManager: DataManager) {
		super(app);
		this.dataManager = dataManager;
	}

	onOpen() {
		super.onOpen();
		this.setModalTitle(UI_TEXT.TITLES.IMPORT_QUOTES);
		const { contentEl } = this;

		contentEl.createEl("p", {
			text: UI_TEXT.LABELS.SELECT_FILE,
		});

		const fileInput = contentEl.createEl("input", {
			type: "file",
			attr: {
				accept: ".json,.csv",
			},
		});

		fileInput.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = async (event) => {
				const content = event.target?.result as string;
				if (!content) {
					new Notice(NOTICES.FILE_EMPTY);
					return;
				}

				let parsedQuotes: string[] = [];
				try {
					if (file.name.endsWith(".json")) {
						const data = JSON.parse(content);
						if (Array.isArray(data)) {
							parsedQuotes = data.filter(
								(item: any) => typeof item === "string",
							);
						} else if (data && Array.isArray(data.quotes)) {
							parsedQuotes = data.quotes.filter(
								(item: any) => typeof item === "string",
							);
						} else {
							throw new Error(
								"Invalid JSON format. Expected an array of strings or an object with a 'quotes' array.",
							);
						}
					} else if (file.name.endsWith(".csv")) {
						parsedQuotes = content
							.split("\n")
							.map((line) => line.trim())
							.filter((line) => line.length > 0);
					}

					const count =
						await this.dataManager.addQuotes(parsedQuotes);
					if (count > 0) {
						new Notice(NOTICES.IMPORT_SUCCESS(count));
					} else {
						new Notice(NOTICES.IMPORT_NO_NEW);
					}
				} catch (error) {
					new Notice(NOTICES.ERROR_PARSING + error.message);
				} finally {
					this.close();
				}
			};

			reader.onerror = () => {
				new Notice(NOTICES.ERROR_READING);
				this.close();
			};

			reader.readAsText(file);
		};
	}
}

export class ChangeFrequencyModal extends BaseGemmyModal {
	dataManager: DataManager;
	onSave: () => void;

	constructor(app: App, dataManager: DataManager, onSave: () => void) {
		super(app);
		this.dataManager = dataManager;
		this.onSave = onSave;
	}

	onOpen() {
		super.onOpen();
		this.setModalTitle(UI_TEXT.TITLES.CHANGE_IDLE_FREQUENCY);
		const { contentEl } = this;

		new Setting(contentEl)
			.setName(UI_TEXT.LABELS.IDLE_FREQUENCY_NAME)
			.setDesc(UI_TEXT.LABELS.IDLE_FREQUENCY_DESC)
			.addText((text) =>
				text
					.setValue(
						this.dataManager.settings.idleTalkFrequency.toString(),
					)
					.onChange(async (value) => {
						const numValue = parseInt(value);
						if (!isNaN(numValue) && numValue > 0) {
							await this.dataManager.updateSettings({
								idleTalkFrequency: numValue,
							});
							this.onSave();
						}
					}),
			);
	}
}

export class ChangeAvatarModal extends BaseGemmyModal {
	dataManager: DataManager;
	onSave: () => void;

	constructor(app: App, dataManager: DataManager, onSave: () => void) {
		super(app);
		this.dataManager = dataManager;
		this.onSave = onSave;
	}

	onOpen() {
		super.onOpen();
		this.setModalTitle(UI_TEXT.TITLES.CHANGE_AVATAR);
		const { contentEl } = this;

		let currentPath = this.dataManager.settings.customAvatarPath || "";

		const setting = new Setting(contentEl)
			.setName(UI_TEXT.LABELS.AVATAR_URL_NAME)
			.setDesc(UI_TEXT.LABELS.AVATAR_URL_DESC);

		let textComponent: any;

		setting.addText((text) => {
			textComponent = text;
			text.setValue(currentPath)
				.setPlaceholder("https://example.com/image.png")
				.onChange((value) => {
					currentPath = value.trim();
				});
		});

		const browseBtnContainer = contentEl.createDiv({
			cls: "gemmy-browse-btn-container gemmy-margin-bottom-20",
		});

		const fileInput = browseBtnContainer.createEl("input", {
			type: "file",
			attr: {
				accept: "image/*",
				style: "display: none;",
			},
		});

		fileInput.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				try {
					new Notice("Processing image...");
					const resourcePath =
						await this.dataManager.saveAvatar(file);

					currentPath = resourcePath;
					if (textComponent) {
						textComponent.setValue(resourcePath);
						new Notice("Image saved successfully!");
					}
				} catch (error) {
					console.error(error);
					new Notice("Error saving image: " + error.message);
				}
			}
		};
		const browseBtn = browseBtnContainer.createEl("button", {
			text: UI_TEXT.BUTTONS.BROWSE_IMAGE,
		});
		browseBtn.onclick = () => fileInput.click();

		const btnDiv = contentEl.createDiv({
			cls: "gemmy-modal-button-container",
		});

		const saveBtn = btnDiv.createEl("button", {
			text: UI_TEXT.BUTTONS.SAVE,
		});
		saveBtn.addClass("mod-cta");
		saveBtn.onclick = async () => {
			await this.dataManager.updateSettings({
				customAvatarPath: currentPath,
			});
			this.onSave();
			this.close();
		};

		const resetBtn = btnDiv.createEl("button", {
			text: UI_TEXT.BUTTONS.RESET,
		});
		resetBtn.onclick = async () => {
			await this.dataManager.updateSettings({
				customAvatarPath: "",
			});
			this.onSave();
			this.close();
		};
	}
}
