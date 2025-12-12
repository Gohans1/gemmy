import {
	App,
	debounce,
	Plugin,
	PluginSettingTab,
	Setting,
	Notice,
	Modal,
} from "obsidian";
import KAPILGUPTA_STATIC from "./kapilgupta.png";

// Cái này giờ chỉ là giá trị khởi tạo ban đầu
const INITIAL_QUOTES = [];

interface GemmySettings {
	idleTalkFrequency: number;
}

const DEFAULT_SETTINGS: GemmySettings = {
	idleTalkFrequency: 5,
};

// Interface để lưu trữ dữ liệu
interface GemmyData {
	settings: GemmySettings;
	quotes: string[];
}

const BUBBLE_DURATION = 5000;

export default class Gemmy extends Plugin {
	settings: GemmySettings;
	allQuotes: string[] = []; // Biến chứa tất cả quotes, bao gồm cả quote mới
	gemmyEl: HTMLElement;
	imageEl: HTMLElement;
	chatBubbleEl: HTMLElement;
	bubbleContentEl: HTMLElement;
	copyButtonEl: HTMLElement;
	nextButtonEl: HTMLElement;
	historyButtonEl: HTMLElement;
	addQuoteButtonEl: HTMLElement;
	viewAllButtonEl: HTMLElement;
	exportButtonEl: HTMLElement;
	bubbleTimeout: number;
	idleIntervalId: number;
	appeared: boolean = false;
	quoteHistory: string[] = [];

	async onload() {
		await this.loadPluginData();

		let gemmyEl = (this.gemmyEl = createDiv("gemmy-container"));
		this.imageEl = gemmyEl.createEl("img", {});
		this.chatBubbleEl = gemmyEl.createDiv({
			cls: ["gemmy-bubble", "hidden"],
		});
		this.bubbleContentEl = this.chatBubbleEl.createDiv({
			cls: "gemmy-bubble-content",
		});
		const buttonContainer = this.chatBubbleEl.createDiv({
			cls: "gemmy-button-container",
		});

		this.viewAllButtonEl = buttonContainer.createEl("button", {
			cls: "gemmy-view-all-button",
			text: "View All",
		});
		this.historyButtonEl = buttonContainer.createEl("button", {
			cls: "gemmy-history-button",
			text: "History",
		});
		this.addQuoteButtonEl = buttonContainer.createEl("button", {
			cls: "gemmy-add-button",
			text: "Add",
		});
		this.copyButtonEl = buttonContainer.createEl("button", {
			cls: "gemmy-copy-button",
			text: "Copy",
		});
		this.nextButtonEl = buttonContainer.createEl("button", {
			cls: "gemmy-next-button",
			text: "Next",
		});

		this.viewAllButtonEl.onclick = () =>
			new ViewAllQuotesModal(this.app, this).open();
		this.historyButtonEl.onclick = () =>
			new HistoryModal(this.app, this.quoteHistory).open();
		this.addQuoteButtonEl.onclick = () => {
			new AddUserQuoteModal(this.app, async (newQuote) => {
				if (!this.allQuotes.includes(newQuote)) {
					this.allQuotes.push(newQuote);
					await this.savePluginData();
					new Notice("New quote saved!");
				} else {
					new Notice("This quote already exists.");
				}
			}).open();
		};
		this.copyButtonEl.onclick = () => {
			navigator.clipboard
				.writeText(this.bubbleContentEl.innerText)
				.then(() => new Notice("Copied!"));
		};
		this.nextButtonEl.onclick = () => {
			this.saySomething();
			this.resetIdleInterval();
		};

		this.addCommand({
			id: "show",
			name: "Show Gemmy",
			callback: () => this.appear(),
		});
		this.addCommand({
			id: "hide",
			name: "Hide Gemmy",
			callback: () => this.disappear(),
		});

		this.addCommand({
			id: "export-all-quotes",
			name: "Export all quotes",
			callback: () => {
				const dataToExport = JSON.stringify(
					{ quotes: this.allQuotes },
					null,
					2,
				);
				const blob = new Blob([dataToExport], {
					type: "application/json",
				});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = "gemmy_all_quotes.json";
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				new Notice("All quotes exported!");
			},
		});

		this.addCommand({
			id: "add-quote",
			name: "Add new quote",
			callback: () => {
				new AddQuoteModal(this.app, async (newQuotes) => {
					const uniqueNewQuotes = newQuotes.filter(
						(q) => !this.allQuotes.includes(q),
					);
					this.allQuotes.push(...uniqueNewQuotes);
					await this.savePluginData();
					new Notice(`${uniqueNewQuotes.length} new quote(s) saved!`);
				}).open();
			},
		});

		this.addCommand({
			id: "import-quotes",
			name: "Import quotes from file",
			callback: () => {
				new ImportModal(this.app, this).open();
			},
		});

		this.addSettingTab(new GemmySettingTab(this.app, this));
		this.resetIdleInterval();
		this.makeDraggable(this.gemmyEl);
		app.workspace.onLayoutReady(this.appear.bind(this));
	}

	resetIdleInterval() {
		if (this.idleIntervalId) window.clearInterval(this.idleIntervalId);
		this.idleIntervalId = window.setInterval(() => {
			if (this.appeared) this.saySomething();
		}, 15000);
		this.registerInterval(this.idleIntervalId);
	}

	appear() {
		this.imageEl.setAttribute("src", KAPILGUPTA_STATIC);
		this.appeared = true;
		document.body.appendChild(this.gemmyEl);
		this.gemmyEl.show();
		this.saySomething();
	}

	disappear() {
		this.bubbleTimeout && clearTimeout(this.bubbleTimeout);
		this.chatBubbleEl.addClass("hidden");
		this.gemmyEl.hide();
		this.appeared = false;
	}

	saySomething() {
		if (!this.appeared) return;
		if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
		if (this.allQuotes.length === 0) return;

		let randomThing =
			this.allQuotes[Math.floor(Math.random() * this.allQuotes.length)];
		this.quoteHistory.unshift(randomThing);
		if (this.quoteHistory.length > 5) this.quoteHistory.pop();

		this.bubbleContentEl.innerText = randomThing;
		this.chatBubbleEl.removeClass("hidden");
		this.imageEl.setAttribute("src", KAPILGUPTA_STATIC);

		this.bubbleTimeout = window.setTimeout(() => {
			this.chatBubbleEl.addClass("hidden");
		}, BUBBLE_DURATION);
	}

	onunload() {
		this.disappear();
	}

	async loadPluginData() {
		const data: GemmyData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data?.settings);
		this.allQuotes = data?.quotes || []; // Just load what's saved, or start fresh
	}

	async savePluginData() {
		await this.saveData({
			settings: this.settings,
			quotes: this.allQuotes, // Save all quotes
		});
	}

	makeDraggable(elmnt: HTMLElement) {
		let pos1 = 0,
			pos2 = 0,
			pos3 = 0,
			pos4 = 0;
		const dragMouseDown = (e: MouseEvent) => {
			e.preventDefault();
			pos3 = e.clientX;
			pos4 = e.clientY;
			document.onmouseup = closeDragElement;
			document.onmousemove = elementDrag;
		};
		const elementDrag = (e: MouseEvent) => {
			e.preventDefault();
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;
			elmnt.style.top = elmnt.offsetTop - pos2 + "px";
			elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
		};
		const closeDragElement = () => {
			document.onmouseup = null;
			document.onmousemove = null;
		};
		this.imageEl.onmousedown = dragMouseDown;
	}

	async importQuotes(newQuotes: string[]) {
		const uniqueNewQuotes = newQuotes.filter(
			(q) => q.trim() !== "" && !this.allQuotes.includes(q),
		);

		if (uniqueNewQuotes.length > 0) {
			this.allQuotes.push(...uniqueNewQuotes);
			await this.savePluginData();
			new Notice(
				`Successfully imported ${uniqueNewQuotes.length} new quote(s).`,
			);
		} else {
			new Notice(
				"No new quotes were imported. They might be duplicates or empty.",
			);
		}
	}
}

// ĐÂY LÀ PHẦN MÀY COPY THIẾU, THẰNG NGU
class GemmySettingTab extends PluginSettingTab {
	plugin: Gemmy;
	constructor(app: App, plugin: Gemmy) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Idle talk frequency")
			.setDesc("How often does Gemmy speak when idle, in minutes.")
			.addSlider((slider) =>
				slider
					.setLimits(5, 60, 5)
					.setValue(this.plugin.settings.idleTalkFrequency)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.idleTalkFrequency = value;
						await this.plugin.savePluginData();
					}),
			);
	}
}

class HistoryModal extends Modal {
	history: string[];
	constructor(app: App, history: string[]) {
		super(app);
		this.history = history;
	}
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Last 5 Quotes" });
		if (this.history.length === 0) {
			contentEl.createEl("p", { text: "No history yet." });
			return;
		}
		const listEl = contentEl.createEl("ol");
		for (const quote of this.history) {
			const listItemEl = listEl.createEl("li");
			listItemEl.createDiv({ text: quote, cls: "history-quote-text" });
			const copyBtn = listItemEl.createEl("button", {
				text: "Copy",
				cls: "history-copy-button",
			});
			copyBtn.onclick = () => {
				navigator.clipboard.writeText(quote).then(() => {
					new Notice(`Copied: "${quote.slice(0, 20)}..."`);
				});
			};
		}
	}
	onClose() {
		this.contentEl.empty();
	}
}

class AddUserQuoteModal extends Modal {
	onSubmit: (quote: string) => void;
	constructor(app: App, onSubmit: (quote: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Add Your Quote" });
		const textarea = contentEl.createEl("textarea", {
			cls: "gemmy-quote-textarea",
			placeholder: "Enter your quote here. It can span multiple lines.",
		});
		textarea.rows = 10;
		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Save")
				.setCta()
				.onClick(() => {
					const quote = textarea.value.trim();
					if (quote) {
						this.onSubmit(quote);
						this.close();
					} else {
						new Notice("Quote cannot be empty.");
					}
				}),
		);
	}
	onClose() {
		this.contentEl.empty();
	}
}

class AddQuoteModal extends Modal {
	onSubmit: (quotes: string[]) => void;
	constructor(app: App, onSubmit: (quotes: string[]) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Add Your Quotes" });
		contentEl.createEl("p", { text: "Enter each quote on a new line." });
		const textarea = contentEl.createEl("textarea", {
			cls: "gemmy-quote-textarea",
		});
		textarea.rows = 10;
		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Save")
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

class ViewAllQuotesModal extends Modal {
	plugin: Gemmy;

	constructor(app: App, plugin: Gemmy) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty(); // Clear previous content
		contentEl.createEl("h2", { text: "All Available Quotes" });

		if (this.plugin.allQuotes.length === 0) {
			contentEl.createEl("p", { text: "No quotes available." });
			return;
		}

		const listEl = contentEl.createEl("ol");
		for (const quote of this.plugin.allQuotes) {
			const listItemEl = listEl.createEl("li");
			listItemEl.createDiv({ text: quote, cls: "history-quote-text" });

			const buttonGroup = listItemEl.createDiv({
				cls: "history-button-group",
			});

			const copyBtn = buttonGroup.createEl("button", {
				text: "Copy",
				cls: "history-copy-button",
			});
			copyBtn.onclick = () => {
				navigator.clipboard.writeText(quote).then(() => {
					new Notice(`Copied: "${quote.slice(0, 20)}..."`);
				});
			};

			const deleteBtn = buttonGroup.createEl("button", {
				text: "Delete",
				cls: "history-delete-button",
			});
			deleteBtn.onclick = async () => {
				const index = this.plugin.allQuotes.indexOf(quote);
				if (index > -1) {
					this.plugin.allQuotes.splice(index, 1);
					await this.plugin.savePluginData();
					new Notice("Quote deleted.");
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

class ImportModal extends Modal {
	plugin: Gemmy;

	constructor(app: App, plugin: Gemmy) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Import Quotes" });
		contentEl.createEl("p", {
			text: "Select a JSON or CSV file to import.",
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
			reader.onload = (event) => {
				const content = event.target?.result as string;
				if (!content) {
					new Notice("File is empty or could not be read.");
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
					this.plugin.importQuotes(parsedQuotes);
				} catch (error) {
					new Notice("Error parsing file: " + error.message);
				} finally {
					this.close();
				}
			};

			reader.onerror = () => {
				new Notice("Error reading file.");
				this.close();
			};

			reader.readAsText(file);
		};
	}

	onClose() {
		this.contentEl.empty();
	}
}
