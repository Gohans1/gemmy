import { App, Modal, Notice, Setting } from "obsidian";
import { DataManager } from "./DataManager";
import { UI_TEXT, NOTICES, CSS_CLASSES, CONSTANTS } from "./constants";

export class ViewFavoritesModal extends Modal {
	dataManager: DataManager;

	constructor(app: App, dataManager: DataManager) {
		super(app);
		this.dataManager = dataManager;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: UI_TEXT.TITLES.FAVORITE_QUOTES });

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

	onClose() {
		this.contentEl.empty();
	}
}

export class AddUserQuoteModal extends Modal {
	onSubmit: (quote: string) => void;
	constructor(app: App, onSubmit: (quote: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: UI_TEXT.TITLES.ADD_YOUR_QUOTE });
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
	onClose() {
		this.contentEl.empty();
	}
}

export class AddQuoteModal extends Modal {
	onSubmit: (quotes: string[]) => void;
	constructor(app: App, onSubmit: (quotes: string[]) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: UI_TEXT.TITLES.ADD_YOUR_QUOTES });
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
	onClose() {
		this.contentEl.empty();
	}
}

export class ViewAllQuotesModal extends Modal {
	dataManager: DataManager;

	constructor(app: App, dataManager: DataManager) {
		super(app);
		this.dataManager = dataManager;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty(); // Clear previous content
		contentEl.createEl("h2", { text: UI_TEXT.TITLES.ALL_AVAILABLE_QUOTES });

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

	onClose() {
		this.contentEl.empty();
	}
}

export class ImportModal extends Modal {
	dataManager: DataManager;

	constructor(app: App, dataManager: DataManager) {
		super(app);
		this.dataManager = dataManager;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: UI_TEXT.TITLES.IMPORT_QUOTES });
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

	onClose() {
		this.contentEl.empty();
	}
}

export class ChangeFrequencyModal extends Modal {
	dataManager: DataManager;
	onSave: () => void;

	constructor(app: App, dataManager: DataManager, onSave: () => void) {
		super(app);
		this.dataManager = dataManager;
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", {
			text: UI_TEXT.TITLES.CHANGE_IDLE_FREQUENCY,
		});

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

	onClose() {
		this.contentEl.empty();
	}
}
