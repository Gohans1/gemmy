import { App, Modal, Notice, Setting } from "obsidian";
import { DataManager } from "./DataManager";
import { UI_TEXT, NOTICES, CSS_CLASSES } from "./constants";

abstract class BaseGemmyModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		this.contentEl.empty();
	}

	onClose() {
		this.contentEl.empty();
	}

	protected setTitle(title: string) {
		this.contentEl.createEl("h2", { text: title });
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
	onSubmit: (quote: string) => void;
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
	onSubmit: (quotes: string[]) => void;
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

		fileInput.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				// @ts-ignore - 'path' property exists on File in Electron/Obsidian environment
				const path = file.path;
				if (path) {
					// Convert backslashes to forward slashes for better cross-platform compatibility if needed,
					// but usually local paths work as is or with file://
					// For display and storage, we keep the path.
					// We might want to prefix with file:// if it's not already,
					// but let's just store the path and let the consumer handle the protocol if needed.
					// However, for immediate feedback, let's just put the path.

					// If we want to be helpful, we can use a utility to convert to a proper URL,
					// but sticking to the absolute path is what the user asked (indirectly).

					// In obsidian context, using 'app://local/' + path is often required for <img> src.
					// But for the setting, let's save the absolute path.
					// The Main class logic currently just uses it as src.
					// If src="C:\..." fails, we might need to fix Main.ts later.
					// But for now, just populate the field.

					currentPath = path;
					textComponent.setValue(path);
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
