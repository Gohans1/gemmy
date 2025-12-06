import {
	App,
	debounce,
	Plugin,
	PluginSettingTab,
	Setting,
	Notice,
} from "obsidian";
import * as data from "./quotes_corrected.json";
import KAPILGUPTA_STATIC from "./kapilgupta.png";

const ALL_QUOTES = data.quotes;

interface GemmySettings {
	idleTalkFrequency: number;
	writingModeGracePeriod: number;
}

const DEFAULT_SETTINGS: GemmySettings = {
	idleTalkFrequency: 5,
	writingModeGracePeriod: 5,
};

const BUBBLE_DURATION = 5000;

export default class Gemmy extends Plugin {
	settings: GemmySettings;
	gemmyEl: HTMLElement;
	imageEl: HTMLElement;
	chatBubbleEl: HTMLElement;
	bubbleContentEl: HTMLElement;
	copyButtonEl: HTMLElement;
	inWritingMode: boolean = false;
	idleTimeout: number;
	writingModeTimeout: number;
	appeared: boolean = false;

	async onload() {
		await this.loadSettings();

		// TẠO ELEMENT
		let gemmyEl = (this.gemmyEl = createDiv("gemmy-container"));
		this.imageEl = gemmyEl.createEl("img", {});
		this.chatBubbleEl = gemmyEl.createDiv({
			cls: ["gemmy-bubble", "hidden"],
		});
		this.bubbleContentEl = this.chatBubbleEl.createDiv({
			cls: "gemmy-bubble-content",
		});
		this.copyButtonEl = this.chatBubbleEl.createEl("button", {
			cls: "gemmy-copy-button",
			text: "Copy",
		});

		// GẮN LOGIC COPY VÀO NÚT
		this.copyButtonEl.onclick = () => {
			const textToCopy = this.bubbleContentEl.innerText;
			navigator.clipboard
				.writeText(textToCopy)
				.then(() => {
					new Notice("Copied!");
				})
				.catch((err) => {
					console.error("Gemmy: Could not copy text: ", err);
					new Notice("Failed to copy.");
				});
		};

		// ĐĂNG KÝ COMMANDS
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

		// ĐĂNG KÝ EVENT CHO EDITOR
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

		// ĐẶT LỊCH SỦA ĐỊNH KỲ 15 GIÂY
		this.registerInterval(
			window.setInterval(() => {
				if (this.appeared && !this.inWritingMode) {
					this.saySomething(ALL_QUOTES);
				}
			}, 15000),
		);

		// CHO PHÉP KÉO THẢ
		this.makeDraggable(this.gemmyEl);

		// CHỜ APP SẴN SÀNG RỒI HIỆN RA
		app.workspace.onLayoutReady(this.appear.bind(this));
	}

	appear() {
		let { gemmyEl, imageEl } = this;
		imageEl.setAttribute("src", KAPILGUPTA_STATIC);
		this.appeared = true;
		document.body.appendChild(gemmyEl);
		gemmyEl.show();

		// SỦA CÂU ĐẦU TIÊN
		if (!this.inWritingMode) {
			this.saySomething(ALL_QUOTES);
		}
	}

	disappear() {
		this.idleTimeout && window.clearTimeout(this.idleTimeout);
		this.writingModeTimeout && window.clearTimeout(this.writingModeTimeout);
		this.imageEl.setAttribute("src", KAPILGUPTA_STATIC);
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
		if (this.writingModeTimeout) {
			window.clearTimeout(this.writingModeTimeout);
		}
		this.writingModeTimeout = window.setTimeout(() => {
			if (!this.inWritingMode) return;
			this.appear();
		}, this.settings.writingModeGracePeriod * 1000);
	}

	saySomething(quotes: string[]) {
		if (!this.appeared) {
			return;
		}

		let randomThing = quotes[Math.floor(Math.random() * quotes.length)];
		this.bubbleContentEl.innerText = randomThing;
		this.chatBubbleEl.removeClass("hidden");
		this.imageEl.setAttribute("src", KAPILGUPTA_STATIC);

		// TỰ ẨN BONG BÓNG SAU 5 GIÂY
		setTimeout(() => {
			this.chatBubbleEl.addClass("hidden");
		}, BUBBLE_DURATION);
	}

	onunload() {
		this.disappear();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	makeDraggable(elmnt: HTMLElement) {
		let pos1 = 0,
			pos2 = 0,
			pos3 = 0,
			pos4 = 0;
		const dragMouseDown = (e: MouseEvent) => {
			e = e || window.event;
			e.preventDefault();
			pos3 = e.clientX;
			pos4 = e.clientY;
			document.onmouseup = closeDragElement;
			document.onmousemove = elementDrag;
		};
		const elementDrag = (e: MouseEvent) => {
			e = e || window.event;
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
						await this.plugin.saveSettings();
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
						await this.plugin.saveSettings();
					}),
			);
	}
}
