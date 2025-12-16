import {
	App,
	Modal,
	Notice,
	Setting,
	ButtonComponent,
	TextComponent,
	setIcon,
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

	protected setTitle(title: string) {
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
		this.setTitle("Focus Mode Settings");
		const { contentEl } = this;

		// --- TIMER SETTINGS ---
		contentEl.createEl("h3", { text: "Timer Settings" });
		new Setting(contentEl)
			.setName("Duration (minutes)")
			.setDesc("Default time when starting a session")
			.addText((text) =>
				text
					.setPlaceholder("25")
					.setValue(
						this.dataManager.settings.focusDuration?.toString() ||
							"25",
					)
					.onChange(async (value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num > 0) {
							await this.dataManager.updateSettings({
								focusDuration: num,
							});
						}
					}),
			);

		// --- PLAYLIST MANAGER ---
		contentEl.createEl("h3", { text: "Playlist Manager" });
		contentEl.createEl("p", {
			text: "Manage your Focus Mode video playlist.",
			cls: "setting-item-description",
		});

		const playlistContainer = contentEl.createDiv("gemmy-modal-playlist");
		playlistContainer.style.maxHeight = "300px";
		playlistContainer.style.overflowY = "auto";
		playlistContainer.style.marginBottom = "20px";

		this.renderPlaylist(playlistContainer);

		// --- ADD NEW TRACK ---
		contentEl.createEl("h4", { text: "Add New Track" });
		const addDiv = contentEl.createDiv("gemmy-add-track-modal");
		addDiv.style.display = "flex";
		addDiv.style.gap = "5px";
		addDiv.style.alignItems = "center";

		const nameInput = new TextComponent(addDiv).setPlaceholder(
			"Track Name",
		);
		nameInput.inputEl.style.flex = "1";

		const urlInput = new TextComponent(addDiv).setPlaceholder(
			"YouTube URL",
		);
		urlInput.inputEl.style.flex = "2";

		new ButtonComponent(addDiv)
			.setButtonText("Add")
			.setCta()
			.onClick(async () => {
				const name = nameInput.getValue().trim();
				const url = urlInput.getValue().trim();
				if (!name || !url) {
					new Notice("Enter both name and URL");
					return;
				}

				const id = this.extractYouTubeId(url);
				if (!id) {
					new Notice("Invalid YouTube URL");
					return;
				}

				const current = this.dataManager.settings.playlist || [];
				await this.dataManager.updateSettings({
					playlist: [...current, { name, url, id }],
				});
				new Notice("Track added!");
				nameInput.setValue("");
				urlInput.setValue("");
				this.renderPlaylist(playlistContainer);
			});
	}

	renderPlaylist(container: HTMLElement) {
		container.empty();
		const playlist = this.dataManager.settings.playlist || [];

		if (playlist.length === 0) {
			container.createEl("div", {
				text: "No music yet.",
				cls: "setting-item-description",
			});
			return;
		}

		playlist.forEach((track, index) => {
			const item = container.createDiv("gemmy-music-item");
			item.style.display = "flex";
			item.style.justifyContent = "space-between";
			item.style.alignItems = "center";
			item.style.padding = "8px";
			item.style.marginBottom = "4px";
			item.style.background = "var(--background-secondary)";
			item.style.borderRadius = "4px";

			// Play Click
			const info = item.createDiv();
			info.style.flex = "1";
			info.style.cursor = "pointer";
			info.createDiv({ text: track.name, style: "font-weight: bold" });
			info.createDiv({
				text: track.url,
				style: "font-size: 0.8em; color: var(--text-muted)",
			});
			info.onclick = () => {
				this.onSelectMusic(track.id);
				this.close();
			};

			// Controls
			const controls = item.createDiv();
			controls.style.display = "flex";
			controls.style.gap = "4px";

			// Move Up
			if (index > 0) {
				const upBtn = new ButtonComponent(controls)
					.setIcon("arrow-up")
					.setTooltip("Move Up")
					.onClick(async () => {
						const newPlaylist = [...playlist];
						[newPlaylist[index - 1], newPlaylist[index]] = [
							newPlaylist[index],
							newPlaylist[index - 1],
						];
						await this.dataManager.updateSettings({
							playlist: newPlaylist,
						});
						this.renderPlaylist(container);
					});
			}

			// Delete
			const delBtn = new ButtonComponent(controls)
				.setIcon("trash")
				.setTooltip("Delete")
				.onClick(async () => {
					const newPlaylist = playlist.filter((_, i) => i !== index);
					await this.dataManager.updateSettings({
						playlist: newPlaylist,
					});
					this.renderPlaylist(container);
				});
			delBtn.buttonEl.addClass("mod-warning");
		});
	}

	extractYouTubeId(url: string): string | null {
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
		this.setTitle(UI_TEXT.TITLES.FAVORITE_QUOTES);
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
	submit: (quote: string) => void;
	constructor(app: App, onSubmit: (quote: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}
	onOpen() {
		super.onOpen();
		this.setTitle(UI_TEXT.TITLES.ADD_YOUR_QUOTE);
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
	submit: (quotes: string[]) => void;
	constructor(app: App, onSubmit: (quotes: string[]) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}
	onOpen() {
		super.onOpen();
		this.setTitle(UI_TEXT.TITLES.ADD_YOUR_QUOTES);
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

	constructor(app: App, dataManager: DataManager) {
		super(app);
		this.dataManager = dataManager;
	}

	onOpen() {
		super.onOpen();
		this.setTitle(UI_TEXT.TITLES.ALL_AVAILABLE_QUOTES);
		const { contentEl } = this;

		if (this.dataManager.allQuotes.length === 0) {
			contentEl.createEl("p", { text: "No quotes available." });
			return;
		}

		const listEl = contentEl.createEl("ol");
		for (const quote of this.dataManager.allQuotes) {
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

			const deleteBtn = buttonGroup.createEl("button", {
				text: UI_TEXT.BUTTONS.DELETE,
				cls: CSS_CLASSES.HISTORY_DELETE_BUTTON,
			});
			deleteBtn.onclick = async () => {
				const success = await this.dataManager.removeQuote(quote);
				if (success) {
					new Notice(NOTICES.QUOTE_DELETED);
					// Re-render the modal content to reflect the change
					this.onOpen();
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
		this.setTitle(UI_TEXT.TITLES.IMPORT_QUOTES);
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
								(item) => typeof item === "string",
							);
						} else if (data && Array.isArray(data.quotes)) {
							parsedQuotes = data.quotes.filter(
								(item) => typeof item === "string",
							);
						} else {
							throw new Error(
								"Invalid JSON format. Expected an array of strings or an object with a 'quotes' array.",
							);
						}
					} else if (file.name.endsWith(".csv")) {
						// Simple CSV parsing: one quote per line
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
		this.setTitle(UI_TEXT.TITLES.CHANGE_IDLE_FREQUENCY);
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
							this.onSave(); // Notify main to reset interval
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
		this.setTitle(UI_TEXT.TITLES.CHANGE_AVATAR);
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

		// Add Browse Button
		const browseBtnContainer = contentEl.createDiv({
			cls: "gemmy-browse-btn-container",
		});
		browseBtnContainer.style.marginBottom = "20px";

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
					// Save the file to plugin directory and get the resource path
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
		btnDiv.style.marginTop = "20px";
		btnDiv.style.display = "flex";
		btnDiv.style.gap = "10px";
		btnDiv.style.justifyContent = "flex-end";

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
