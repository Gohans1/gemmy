import {
	App,
	debounce,
	Plugin,
	PluginSettingTab,
	Setting,
	Notice,
	Modal,
} from "obsidian";
import * as data from "./quotes_corrected.json";
import KAPILGUPTA_STATIC from "./kapilgupta.png";

// Cái này giờ chỉ là giá trị khởi tạo ban đầu
const INITIAL_QUOTES = data.quotes;

interface GemmySettings {
	idleTalkFrequency: number;
	writingModeGracePeriod: number;
}

const DEFAULT_SETTINGS: GemmySettings = {
	idleTalkFrequency: 5,
	writingModeGracePeriod: 5,
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
	inWritingMode: boolean = false;
	bubbleTimeout: number;
	idleIntervalId: number;
	writingModeTimeout: number;
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
		this.addQuoteButtonEl = buttonContainer.createEl("button", {
			cls: "gemmy-add-button",
			text: "Add",
		});
		this.historyButtonEl = buttonContainer.createEl("button", {
			cls: "gemmy-history-button",
			text: "History",
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
			new ViewAllQuotesModal(this.app, this.allQuotes).open();
		this.addQuoteButtonEl.onclick = () => {
			new AddQuoteModal(this.app, async (newQuotes) => {
				const uniqueNewQuotes = newQuotes.filter(
					(q) => !this.allQuotes.includes(q),
				);
				this.allQuotes.push(...uniqueNewQuotes);
				await this.savePluginData();
				new Notice(`${uniqueNewQuotes.length} new quote(s) saved!`);
			}).open();
		};
		this.historyButtonEl.onclick = () =>
			new HistoryModal(this.app, this.quoteHistory).open();
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
			id: "enter-writing-mode",
			name: "Enter writing mode",
			callback: () => this.enterWritingMode(),
		});
		this.addCommand({
			id: "leave-writing-mode",
			name: "Leave writing mode",
			callback: () => this.leaveWritingMode(),
		});

		this.addSettingTab(new GemmySettingTab(this.app, this));
		this.registerEvent(
			this.app.workspace.on(
				"editor-change",
				debounce(() => {
					if (!this.inWritingMode) return;
					this.disappear();
					this.setWritingModeTimeout();
				}, 500),
			),
		);
		this.resetIdleInterval();
		this.makeDraggable(this.gemmyEl);
		app.workspace.onLayoutReady(this.appear.bind(this));
	}

	resetIdleInterval() {
		if (this.idleIntervalId) window.clearInterval(this.idleIntervalId);
		this.idleIntervalId = window.setInterval(() => {
			if (this.appeared && !this.inWritingMode) this.saySomething();
		}, 15000);
		this.registerInterval(this.idleIntervalId);
	}

	appear() {
		this.imageEl.setAttribute("src", KAPILGUPTA_STATIC);
		this.appeared = true;
		document.body.appendChild(this.gemmyEl);
		this.gemmyEl.show();
		if (!this.inWritingMode) this.saySomething();
	}

	disappear() {
		this.writingModeTimeout && window.clearTimeout(this.writingModeTimeout);
		this.bubbleTimeout && clearTimeout(this.bubbleTimeout);
		this.chatBubbleEl.addClass("hidden");
		this.gemmyEl.hide();
		this.appeared = false;
	}

	enterWritingMode() {
		this.inWritingMode = true;
		this.disappear();
		this.setWritingModeTimeout();
	}
	leaveWritingMode() {
		this.inWritingMode = false;
		this.disappear();
		window.clearTimeout(this.writingModeTimeout);
	}
	setWritingModeTimeout() {
		if (this.writingModeTimeout)
			window.clearTimeout(this.writingModeTimeout);
		this.writingModeTimeout = window.setTimeout(() => {
			if (!this.inWritingMode) return;
			this.appear();
		}, this.settings.writingModeGracePeriod * 1000);
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
		const savedQuotes = data?.quotes || [];
		this.allQuotes = [...new Set([...INITIAL_QUOTES, ...savedQuotes])];
	}

	async savePluginData() {
		const userQuotes = this.allQuotes.filter(
			(q) => !INITIAL_QUOTES.includes(q),
		);
		await this.saveData({
			settings: this.settings,
			quotes: userQuotes,
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

		new Setting(containerEl)
			.setName("Writing mode grace period")
			.setDesc(
				"How soon Gemmy starts to get disappointed after you stop tying in writing mode, in seconds.",
			)
			.addSlider((slider) =>
				slider
					.setLimits(5, 180, 5)
					.setDynamicTooltip()
					.setValue(this.plugin.settings.writingModeGracePeriod)
					.onChange(async (value) => {
						this.plugin.settings.writingModeGracePeriod = value;
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
	allQuotes: string[];
	constructor(app: App, allQuotes: string[]) {
		super(app);
		this.allQuotes = allQuotes;
	}
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "All Available Quotes" });
		if (this.allQuotes.length === 0) {
			contentEl.createEl("p", { text: "No quotes available." });
			return;
		}
		const listEl = contentEl.createEl("ol");
		for (const quote of this.allQuotes) {
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
