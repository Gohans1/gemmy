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
	chatBubbleEl: HTMLElement; // THÊM CÁI LỒN NÀY VÀO
	writingModeTimeout: number;
	appeared: boolean = false;

	async onload() {
		await this.loadSettings();

		let gemmyEl = (this.gemmyEl = createDiv("gemmy-container"));
		// VỨT HẾT MẤY CÁI ARIA-LABEL XÀM CẶC ĐI

		this.imageEl = gemmyEl.createEl("img", {});

		// ĐÂY, TẠO RA NÓ ĐÂY
		this.chatBubbleEl = gemmyEl.createDiv({
			cls: ["gemmy-bubble", "hidden"],
		});

		// ... (code addCommand các kiểu giữ nguyên)

		// SỬA LẠI MẤY CÁI EVENT LISTENER

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
		// Thêm cái này vào cuối hàm onload()
		this.registerInterval(
			window.setInterval(() => {
				if (this.appeared && !this.inWritingMode) {
					this.saySomething(ALL_QUOTES);
				}
			}, 15000), // 15000 milliseconds = 15 giây
		);
		this.makeDraggable(this.gemmyEl);
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

		this.imageEl.setAttribute("src", KAPILGUPTA_STATIC);

		// VỨT MẸ CÁI dispatchEvent ĐI, THAY BẰNG CÁI NÀY
		this.chatBubbleEl.addClass("hidden");

		this.gemmyEl.hide();
		this.appeared = false;
		if (!this.inWritingMode) {
			this.saySomething(ALL_QUOTES);
		}
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

	// Sửa thành như này
	saySomething(quotes: string[]) {
		// Vứt mẹ `persistent` đi
		if (!this.appeared) {
			return;
		}

		let randomThing = quotes[Math.floor(Math.random() * quotes.length)];

		this.chatBubbleEl.innerText = randomThing;
		this.chatBubbleEl.removeClass("hidden");
		this.imageEl.setAttribute("src", KAPILGUPTA_STATIC);

		// Luôn luôn tự động ẩn
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
			// Lấy vị trí chuột lúc nhấn xuống
			pos3 = e.clientX;
			pos4 = e.clientY;
			// Đăng ký event khi thả chuột và di chuột trên toàn bộ document
			document.onmouseup = closeDragElement;
			document.onmousemove = elementDrag;
		};

		const elementDrag = (e: MouseEvent) => {
			e = e || window.event;
			e.preventDefault();
			// Tính toán vị trí mới của con trỏ
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;
			// Set vị trí mới cho element
			elmnt.style.top = elmnt.offsetTop - pos2 + "px";
			elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
		};

		const closeDragElement = () => {
			// Dừng theo dõi khi thả chuột
			document.onmouseup = null;
			document.onmousemove = null;
		};

		// Gắn event mousedown vào chính cái ảnh hoặc cả container
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
