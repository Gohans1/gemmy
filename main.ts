import { App, debounce, Plugin, PluginSettingTab, Setting } from "obsidian";
import * as data from "./quotes_corrected.json";
import KAPILGUPTA_STATIC from "./kapilgupta.png";

const ALL_QUOTES = data.quotes;

interface GemmySettings {
	// how often does Gemmy talk in idle mode, in minutes
	idleTalkFrequency: number;
	// the number of minutes you must write before Gemmy appears to mock you
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
	inWritingMode: boolean = false;
	idleTimeout: number;
	writingModeTimeout: number;
	appeared: boolean = false;

	async onload() {
		await this.loadSettings();

		let gemmyEl = (this.gemmyEl = createDiv("gemmy-container"));
		gemmyEl.setAttribute("aria-label-position", "top");
		gemmyEl.setAttribute("aria-label-delay", "0");
		gemmyEl.setAttribute("aria-label-classes", "gemmy-tooltip");

		this.imageEl = gemmyEl.createEl("img", {});

		this.addCommand({
			id: "show",
			name: "Show Gemmy",
			callback: () => {
				this.appear();
			},
		});

		this.addCommand({
			id: "hide",
			name: "Hide Gemmy",
			callback: () => {
				this.disappear();
			},
		});

		this.addCommand({
			id: "enter-writing-mode",
			name: "Enter writing mode",
			callback: () => {
				this.enterWritingMode();
			},
		});

		this.addCommand({
			id: "leave-writing-mode",
			name: "Leave writing mode",
			callback: () => {
				this.leaveWritingMode();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new GemmySettingTab(this.app, this));

		this.gemmyEl.addEventListener("mouseenter", () => {
			if (this.inWritingMode) {
				return;
			}

			this.saySomething(ALL_QUOTES, true);
			this.idleTimeout && clearTimeout(this.idleTimeout);
		});
		this.gemmyEl.addEventListener("mouseleave", () => {
			if (this.inWritingMode) {
				return;
			}

			this.imageEl.setAttribute("src", KAPILGUPTA_STATIC);
			this.startNextIdleTimeout();
		});

		this.startNextIdleTimeout();

		// debounce editor-change event on workspace
		this.registerEvent(
			this.app.workspace.on(
				"editor-change",
				debounce(() => {
					if (!this.inWritingMode) {
						return;
					}

					this.disappear();
					this.setWritingModeTimeout();
				}, 500),
			),
		);

		app.workspace.onLayoutReady(this.appear.bind(this));
	}

	appear() {
		let { gemmyEl, imageEl } = this;

		imageEl.setAttribute("src", KAPILGUPTA_STATIC); // Thay hết bằng ảnh tĩnh
		this.appeared = true; // Cho nó hiện ra luôn, chờ cái lồn gì nữa

		document.body.appendChild(gemmyEl);
		gemmyEl.show();
	}

	disappear() {
		this.idleTimeout && window.clearTimeout(this.idleTimeout);
		this.writingModeTimeout && window.clearTimeout(this.writingModeTimeout);

		// Vứt mẹ animation đi, ảnh nào thì cũng là ảnh tĩnh thôi
		this.imageEl.setAttribute("src", KAPILGUPTA_STATIC);
		// remote tooltip
		this.gemmyEl.dispatchEvent(
			new MouseEvent("mouseout", {
				bubbles: true,
				clientX: 10,
				clientY: 10,
			}),
		);

		// Ẩn luôn và ngay, chờ cái lồn gì nữa
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
			if (!this.inWritingMode) {
				return;
			}

			this.appear();
		}, this.settings.writingModeGracePeriod * 1000);
	}

	startNextIdleTimeout() {
		const fixedTimeout = 15000;

		if (this.idleTimeout) {
			window.clearTimeout(this.idleTimeout);
		}

		this.idleTimeout = window.setTimeout(() => {
			if (this.inWritingMode) {
				return;
			}

			this.saySomething(ALL_QUOTES, false);
			this.startNextIdleTimeout();
		}, fixedTimeout);
	}

	saySomething(quotes: string[], persistent: boolean) {
		if (!this.appeared) {
			return;
		}

		let randomThing = quotes[Math.floor(Math.random() * quotes.length)];

		this.gemmyEl.setAttr("aria-label", randomThing);
		this.gemmyEl.setAttr("aria-label-position", "top");
		this.gemmyEl.dispatchEvent(
			new MouseEvent("mouseover", {
				bubbles: true,
				clientX: 10,
				clientY: 10,
			}),
		);

		// Ảnh lúc lồn nào cũng là 1, đéo cần if else xàm cặc
		this.imageEl.setAttribute("src", KAPILGUPTA_STATIC);

		if (!persistent) {
			// Chỉ lo ẩn cái bubble thôi, ảnh đéo cần đổi
			setTimeout(() => {
				this.gemmyEl.dispatchEvent(
					new MouseEvent("mouseout", {
						bubbles: true,
						clientX: 10,
						clientY: 10,
					}),
				);
			}, BUBBLE_DURATION);
		}
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
