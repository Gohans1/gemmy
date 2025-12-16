import { Plugin, Notice, Menu, setIcon } from "obsidian";
import KAPILGUPTA_STATIC from "./kapilgupta.png";
import { GemmySettingTab } from "./settings";
import { DataManager } from "./DataManager";
import {
	CONSTANTS,
	CSS_CLASSES,
	UI_TEXT,
	NOTICES,
	COMMANDS,
} from "./constants";
import {
	ViewFavoritesModal,
	ViewAllQuotesModal,
	AddUserQuoteModal,
	AddQuoteModal,
	ImportModal,
	ChangeFrequencyModal,
	ChangeAvatarModal,
	FocusSettingsModal,
} from "./modals";

export default class Gemmy extends Plugin {
	dataManager: DataManager;
	isFavouriteMode = false;
	isFocusMode = false;
	gemmyEl: HTMLElement;
	imageEl: HTMLElement;
	chatBubbleEl: HTMLElement;
	bubbleContentEl: HTMLElement;

	// Buttons
	nextButtonEl: HTMLElement;
	previousButtonEl: HTMLElement;
	menuButtonEl: HTMLElement;
	favoriteButtonEl: HTMLElement;
	focusButtonEl: HTMLElement;
	toggleModeButtonEl: HTMLElement;

	// Focus Mode Elements
	focusVolumeSliderEl: HTMLInputElement;
	playPauseButtonEl: HTMLElement;
	focusSettingsButtonEl: HTMLElement;

bubbleTimeout: number;
	idleIntervalId: number;
	appeared = false;
	quoteHistory: string[] = [];
	historyIndex = 0;

	// Focus State
	timerInterval: number | null = null;
	pomodoroTimeLeft = 0;
	isPlayingMusic = false;
    currentMusicId: string | null = null;
	isTimerRunning = false;

	await onload() {
		this.dataManager = new DataManager(this);
		await this.dataManager.load();

		const gemmyEl = (this.gemmyEl = createDiv(CSS_CLASSES.GEMMY_CONTAINER));
		this.imageEl = gemmyEl.createEl("img", {});
		this.chatBubbleEl = gemmyEl.createDiv({
			cls: [CSS_CLASSES.GEMMY_BUBBLE, CSS_CLASSES.HIDDEN],
		});
		this.bubbleContentEl = this.chatBubbleEl.createDiv({
			cls: CSS_CLASSES.GEMMY_BUBBLE_CONTENT,
		});

		// --- FOCUS MODE CONTROLS ---
		this.focusVolumeSliderEl = this.chatBubbleEl.createEl("input", {
			type: "range",
			cls: "gemmy-volume-slider hidden",
		});
		this.focusVolumeSliderEl.min = "0";
		this.focusVolumeSliderEl.max = "100";
		this.focusVolumeSliderEl.value = "50";
		this.focusVolumeSliderEl.oninput = (e) => {
			// @ts-ignore
			const volume = parseInt(e.target.value);
			this.setMusicVolume(volume);
		};

		const buttonContainer = this.chatBubbleEl.createDiv({
			cls: CSS_CLASSES.GEMMY_BUTTON_CONTAINER,
		});

		// 1. Focus Settings Button (Replaces Music Menu)
		this.focusSettingsButtonEl = buttonContainer.createEl("button", {
			cls: "gemmy-focus-settings-button hidden",
		});
		setIcon(this.focusSettingsButtonEl, "settings");
		this.focusSettingsButtonEl.setAttribute("data-tooltip", "Focus Settings & Music");
		this.focusSettingsButtonEl.onclick = () => {
			new FocusSettingsModal(this.app, this.dataManager, (videoId) => {
				this.currentMusicId = videoId;
				this.playFocusMusic(videoId);
				this.isPlayingMusic = true;
				setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
			}).open();
		};

		// 2. Play/Pause Button
		this.playPauseButtonEl = buttonContainer.createEl("button", {
			cls: "gemmy-play-pause-button hidden",
		});
		setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
		this.playPauseButtonEl.setAttribute("data-tooltip", "Pause Music");
		this.playPauseButtonEl.onclick = () => this.toggleMusicPlayback();

		// 3. Focus Toggle Button
		this.focusButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.FOCUS_BUTTON,
			text: UI_TEXT.ICONS.FOCUS_OFF,
		});
		this.focusButtonEl.setAttribute("data-tooltip", COMMANDS.TOGGLE_FOCUS_MODE.name);
		this.focusButtonEl.onclick = () => this.toggleFocusMode();

		// 4. Normal Mode Buttons
		this.toggleModeButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.TOGGLE_MODE_BUTTON,
			text: UI_TEXT.ICONS.NORMAL_MODE,
		});

		this.favoriteButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.FAVORITE_BUTTON,
			text: UI_TEXT.ICONS.HEART_EMPTY,
		});

		this.menuButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.MENU_BUTTON,
		});
		setIcon(this.menuButtonEl, UI_TEXT.ICONS.MENU);

		this.previousButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.NEXT_BUTTON,
			text: UI_TEXT.BUTTONS.PREV,
		});

		this.nextButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.NEXT_BUTTON,
			text: UI_TEXT.BUTTONS.NEXT,
		});

		// --- EVENT HANDLERS ---
		this.toggleModeButtonEl.onclick = () => this.toggleFavMode();
		this.favoriteButtonEl.onclick = () => this.toggleFavorite();
		this.menuButtonEl.onclick = (e) => this.showMainMenu(e);
		this.previousButtonEl.onclick = () => this.showPrevQuote();
		this.nextButtonEl.onclick = () => this.showNextQuote();

		// --- COMMANDS ---
		this.addCommand({ id: COMMANDS.SHOW_GEMMY.id, name: COMMANDS.SHOW_GEMMY.name, callback: () => this.appear() });
		this.addCommand({ id: COMMANDS.TOGGLE_FOCUS_MODE.id, name: COMMANDS.TOGGLE_FOCUS_MODE.name, callback: () => this.toggleFocusMode() });

		this.addSettingTab(new GemmySettingTab(this.app, this, this.dataManager));
		this.resetIdleInterval();
		this.makeDraggable(this.gemmyEl);
		this.app.workspace.onLayoutReady(this.appear.bind(this));
	}

	toggleFocusMode() {
		this.isFocusMode = !this.isFocusMode;
		const buttonContainer = this.chatBubbleEl.querySelector(`.${CSS_CLASSES.GEMMY_BUTTON_CONTAINER}`);

		if (this.isFocusMode) {
			if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
			this.focusButtonEl.innerText = UI_TEXT.ICONS.FOCUS_ON;
			new Notice(NOTICES.FOCUS_MODE_ON);
			this.imageEl.style.opacity = "1";
			if (buttonContainer) buttonContainer.addClass("focus-mode-active");

			// Hide Normal Buttons
			this.toggleModeButtonEl.addClass("hidden");
			this.favoriteButtonEl.addClass("hidden");
			this.menuButtonEl.addClass("hidden");
			this.previousButtonEl.addClass("hidden");
			this.nextButtonEl.addClass("hidden");

			// Show Focus Buttons
			this.focusVolumeSliderEl.removeClass("hidden");
			this.focusSettingsButtonEl.removeClass("hidden");
			this.playPauseButtonEl.removeClass("hidden");

			// Init Timer State
			const defaultMins = this.dataManager.settings.focusDuration || 25;
			this.pomodoroTimeLeft = defaultMins * 60;
			this.isTimerRunning = false;
			this.renderFocusUI();

			// Auto-play music if available
			const playlist = this.dataManager.settings.playlist || [];
			if (playlist.length > 0 && !this.currentMusicId) {
				this.currentMusicId = playlist[0].id;
				this.playFocusMusic(this.currentMusicId);
				this.isPlayingMusic = true;
			}

		} else {
			this.focusButtonEl.innerText = UI_TEXT.ICONS.FOCUS_OFF;
			new Notice(NOTICES.FOCUS_MODE_OFF);
			this.stopPomodoro();
			this.stopFocusMusic();
			this.imageEl.style.opacity = "1";
			if (buttonContainer) buttonContainer.removeClass("focus-mode-active");

			// Hide Focus Buttons
			this.focusVolumeSliderEl.addClass("hidden");
			this.focusSettingsButtonEl.addClass("hidden");
			this.playPauseButtonEl.addClass("hidden");

			// Show Normal Buttons
			this.toggleModeButtonEl.removeClass("hidden");
			this.favoriteButtonEl.removeClass("hidden");
			this.menuButtonEl.removeClass("hidden");
			this.previousButtonEl.removeClass("hidden");
			this.nextButtonEl.removeClass("hidden");

			this.saySomething();
		}
	}

	rendersFocusUI() {
		this.bubbleContentEl.empty();
		const container = this.bubbleContentEl.createDiv("gemmy-focus-ui");
		container.style.display = "flex";
		container.style.alignItems = "center";
		container.style.justifyContent = "center";
		container.style.gap = "8px";
		container.style.fontSize = "1.2em";
		container.style.fontWeight = "bold";

		if (!this.isTimerRunning) {
			// SETUP MODE: [Input Mins] [Start]
			const input = container.createEl("input", { type: "number" });
			const currentMins = Math.floor(this.pomodoroTimeLeft / 60);
			input.value = currentMins.toString();
			input.style.width = "50px";
			input.style.textAlign = "center";
			input.style.background = "transparent";
			input.style.border = "none";
			input.style.borderBottom = "1px solid var(--text-muted)";
			input.placeholder = "25";

			// Auto-save edited time to state immediately
			input.onchange = () => {
				const mins = parseInt(input.value);
				if (!isNaN(mins) && mins > 0) {
					this.pomodoroTimeLeft = mins * 60;
				}
			};

			const startBtn = container.createEl("button", { cls: "clickable-icon" });
			setIcon(startBtn, "play");
			startBtn.setAttribute("aria-label", "Start Timer");
			startBtn.onclick = () => {
				// Re-validate just in case
				const mins = parseInt(input.value);
				if (!isNaN(mins) && mins > 0) {
					this.pomodoroTimeLeft = mins * 60;
					this.startPomodoro();
				}
			};
		} else {
			// RUNNING MODE: [MM:SS] [Stop]
			const minutes = Math.floor(this.pomodoroTimeLeft / 60);
			const seconds = this.pomodoroTimeLeft % 60;
			const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

			container.createSpan({ text: timeStr });

			const stopBtn = container.createEl("button", { cls: "clickable-icon" });
			setIcon(stopBtn, "square"); // Stop icon
			stopBtn.setAttribute("aria-label", "Stop Timer");
			stopBtn.onclick = () => {
				this.stopPomodoro();
				this.renderFocusUI(); // Re-render to Setup Mode
			};
		}
	}

	startPomodoro() {
		this.isTimerRunning = true;
		this.renderFocusUI(); // Switch to Running UI

		if (this.timerInterval) clearInterval(this.timerInterval);
		this.timerInterval = window.setInterval(() => {
			this.pomodoroTimeLeft--;
			if (this.pomodoroTimeLeft <= 0) {
				this.stopPomodoro();
				this.bubbleContentEl.empty();
				this.bubbleContentEl.createDiv({ text: "Time's up! 🍅", cls: "gemmy-focus-finished" });
				new Notice("Gemmy: Session Finished!");
			} else {
				// Efficient re-render: just update text if possible, but full render is safe for simple UI
				// Actually for running mode, let's just update the span content to avoid flicker
				const container = this.bubbleContentEl.querySelector(".gemmy-focus-ui");
				if(container) {
					const span = container.querySelector("span");
					if(span) {
						const minutes = Math.floor(this.pomodoroTimeLeft / 60);
						const seconds = this.pomodoroTimeLeft % 60;
						const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
						span.innerText = timeStr;
					} else {
						this.renderFocusUI(); // Fallback
					}
				}
			}
		}, 1000);
	}

	stopPomodoro() {
		this.isTimerRunning = false;
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	playFocusMusic(videoId: string) {
		this.stopFocusMusic(); // Clear old iframe
		if (!videoId) return;

		const iframe = document.createElement("iframe");
		iframe.id = "gemmy-focus-music-player";
		iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&enablejsapi=1&controls=0&origin=${window.location.origin}`;
		iframe.style.width = "1px";
		iframe.style.height = "1px";
		iframe.style.opacity = "0.01";
		iframe.style.position = "absolute";
		iframe.style.top = "-9999px";
		iframe.style.pointerEvents = "none";
		iframe.allow = "autoplay; encrypted-media";
		document.body.appendChild(iframe);

		iframe.onload = () => {
			setTimeout(() => {
				this.sendYouTubeCommand("setPlaybackQuality", ["small"]);
				this.sendYouTubeCommand("playVideo", []);
				// @ts-ignore
				const vol = parseInt(this.focusVolumeSliderEl.value);
				this.setMusicVolume(vol);
			}, 1500);
		};
	}

	toggleMusicPlayback() {
		if (this.isPlayingMusic) {
			this.sendYouTubeCommand("pauseVideo", []);
			setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PLAY);
			this.isPlayingMusic = false;
		} else {
			this.sendYouTubeCommand("playVideo", []);
			setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
			this.isPlayingMusic = true;
		}
	}

	setMusicVolume(volume: number) {
		this.sendYouTubeCommand("setVolume", [volume]);
	}

	sendYouTubeCommand(func: string, args: any[]) {
		const iframe = document.getElementById("gemmy-focus-music-player") as HTMLIFrameElement;
		if (iframe && iframe.contentWindow) {
			iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: func, args: args }), "*");
		}
	}

	stopFocusMusic() {
		const iframe = document.getElementById("gemmy-focus-music-player");
		if (iframe) iframe.remove();
	}

	// --- NORMAL MODE HELPERS ---
	toggleFavMode() {
		this.isFavouriteMode = !this.isFavouriteMode;
		if (this.isFavouriteMode) {
			if (this.dataManager.favoriteQuotes.length === 0) {
				new Notice(NOTICES.NO_FAVORITES_YET);
				this.isFavouriteMode = false;
				return;
			}
			this.toggleModeButtonEl.innerText = UI_TEXT.ICONS.FAVORITE_MODE;
			this.toggleModeButtonEl.setAttribute("data-tooltip", UI_TEXT.LABELS.SWITCH_TO_NORMAL_MODE);
			new Notice(NOTICES.SWITCHED_TO_FAV);
		} else {
			this.toggleModeButtonEl.innerText = UI_TEXT.ICONS.NORMAL_MODE;
			this.toggleModeButtonEl.setAttribute("data-tooltip", UI_TEXT.LABELS.SWITCH_TO_FAV_MODE);
			new Notice(NOTICES.SWITCHED_TO_NORMAL);
		}
		this.saySomething();
	}

	async toggleFavorite() {
		const currentQuote = this.bubbleContentEl.innerText;
		const added = await this.dataManager.toggleFavorite(currentQuote);
		if (added) {
			this.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_FILLED;
			new Notice(NOTICES.ADDED_TO_FAVORITES);
		} else {
			this.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_EMPTY;
			new Notice(NOTICES.REMOVED_FROM_FAVORITES);
		}
	}

	showMainMenu(event: MouseEvent) {
		const menu = new Menu();
		menu.addItem((item) => item.setTitle(UI_TEXT.MENU_ITEMS.COPY_CURRENT).setIcon(UI_TEXT.ICONS.COPY).onClick(() => {
			navigator.clipboard.writeText(this.bubbleContentEl.innerText).then(() => new Notice(NOTICES.COPIED));
		}));
		menu.addSeparator();
		menu.addItem((item) => item.setTitle(UI_TEXT.MENU_ITEMS.VIEW_FAVORITES).setIcon(UI_TEXT.ICONS.STAR).onClick(() => new ViewFavoritesModal(this.app, this.dataManager).open()));
		menu.addItem((item) => item.setTitle(UI_TEXT.MENU_ITEMS.VIEW_ALL).setIcon(UI_TEXT.ICONS.DOCUMENTS).onClick(() => new ViewAllQuotesModal(this.app, this.dataManager).open()));
		menu.addItem((item) => item.setTitle(UI_TEXT.MENU_ITEMS.ADD_NEW).setIcon(UI_TEXT.ICONS.PLUS_CIRCLE).onClick(() => new AddUserQuoteModal(this.app, async (newQuote) => {
			const success = await this.dataManager.addQuote(newQuote);
			if (success) new Notice(NOTICES.NEW_QUOTE_SAVED);
			else new Notice(NOTICES.QUOTE_EXISTS);
		}).open()));
		menu.addItem((item) => item.setTitle(UI_TEXT.MENU_ITEMS.IMPORT).setIcon(UI_TEXT.ICONS.UPLOAD).onClick(() => new ImportModal(this.app, this.dataManager).open()));
		menu.addItem((item) => item.setTitle(UI_TEXT.MENU_ITEMS.EXPORT).setIcon(UI_TEXT.ICONS.DOWNLOAD).onClick(() => this.exportQuotes()));
		menu.addSeparator();
		menu.addItem((item) => item.setTitle(UI_TEXT.MENU_ITEMS.CHANGE_AVATAR).setIcon(UI_TEXT.ICONS.IMAGE).onClick(() => new ChangeAvatarModal(this.app, this.dataManager, () => { if (this.appeared) this.imageEl.setAttribute("src", this.getAvatarSource()); }).open()));
		menu.addItem((item) => item.setTitle(UI_TEXT.MENU_ITEMS.CHANGE_FREQUENCY).setIcon(UI_TEXT.ICONS.CLOCK).onClick(() => new ChangeFrequencyModal(this.app, this.dataManager, () => this.resetIdleInterval()).open()));
		menu.addItem((item) => item.setTitle(UI_TEXT.MENU_ITEMS.HIDE_GEMMY).setIcon(UI_TEXT.ICONS.EYE_OFF).onClick(() => this.disappear()));
		menu.showAtMouseEvent(event);
	}

	showPrevQuote() {
		if (this.historyIndex < this.quoteHistory.length - 1) {
			this.historyIndex++;
			const prevQuote = this.quoteHistory[this.historyIndex];
			this.bubbleContentEl.innerText = prevQuote;
			this.updateFavoriteButtonState(prevQuote);
		} else {
			new Notice(NOTICES.NO_MORE_HISTORY);
		}
	}

	showNextQuote() {
		if (this.historyIndex > 0) {
			this.historyIndex--;
			const nextQuote = this.quoteHistory[this.historyIndex];
			this.bubbleContentEl.innerText = nextQuote;
			this.updateFavoriteButtonState(nextQuote);
		} else {
			this.saySomething();
		}
		this.resetIdleInterval();
	}

	exportQuotes() {
		const dataToExport = JSON.stringify({ quotes: this.dataManager.allQuotes }, null, 2);
		const blob = new Blob([dataToExport], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "gemmy_all_quotes.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		new Notice(NOTICES.ALL_QUOTES_EXPORTED);
	}

	resetIdleInterval() {
		if (this.idleIntervalId) window.clearInterval(this.idleIntervalId);
		this.idleIntervalId = window.setInterval(() => {
			if (this.appeared) this.saySomething();
		}, this.dataManager.settings.idleTalkFrequency * 1000);
		this.registerInterval(this.idleIntervalId);
	}

	getAvatarSource(): string {
		const customPath = this.dataManager.settings.customAvatarPath;
		if (customPath && customPath.trim() !== "") {
			const path = customPath.trim();
			if (path.startsWith("http") || path.startsWith("app://")) return path;
			let normalizedPath = path.replace(/\\/g, "/");
			if (!normalizedPath.startsWith("/")) normalizedPath = "/" + normalizedPath;
			return "app://local" + normalizedPath;
		}
		return KAPILGUPTA_STATIC;
	}

	appear() {
		this.imageEl.setAttribute("src", this.getAvatarSource());
		this.appeared = true;
		document.body.appendChild(this.gemmyEl);
		this.gemmyEl.show();
		this.saySomething();
	}

	disappear() {
		if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
		this.chatBubbleEl.addClass(CSS_CLASSES.HIDDEN);
		this.gemmyEl.hide();
		this.appeared = false;
	}

	updateFavoriteButtonState(quote: string) {
		if (this.dataManager.isFavorite(quote)) this.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_FILLED;
		else this.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_EMPTY;
	}

	saySomething() {
		if (!this.appeared || this.isFocusMode) return;
		if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);

		let sourceQuotes = this.dataManager.allQuotes;
		if (this.isFavouriteMode) {
			if (this.dataManager.favoriteQuotes.length === 0) {
				this.isFavouriteMode = false;
				this.toggleModeButtonEl.innerText = UI_TEXT.ICONS.NORMAL_MODE;
				new Notice(NOTICES.NO_FAVORITES_YET);
			} else {
				sourceQuotes = this.dataManager.favoriteQuotes;
			}
		}

		if (sourceQuotes.length === 0) return;

		this.historyIndex = 0;
		const randomThing = sourceQuotes[Math.floor(Math.random() * sourceQuotes.length)];
		this.quoteHistory.unshift(randomThing);
		if (this.quoteHistory.length > 5) this.quoteHistory.pop();

		this.bubbleContentEl.empty();
		this.bubbleContentEl.innerText = randomThing;
		this.updateFavoriteButtonState(randomThing);

		this.chatBubbleEl.removeClass(CSS_CLASSES.HIDDEN);
		this.imageEl.setAttribute("src", this.getAvatarSource());

		this.bubbleTimeout = window.setTimeout(() => {
			this.chatBubbleEl.addClass(CSS_CLASSES.HIDDEN);
		}, CONSTANTS.BUBBLE_DURATION);
	}

	onunload() {
		this.stopPomodoro();
		this.disappear();
	}

	makeDraggable(elmnt: HTMLElement) {
		let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
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
			elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
			elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
		};
		const closeDragElement = () => {
			document.onmouseup = null;
			document.onmousemove = null;
		};
		this.imageEl.onmousedown = dragMouseDown;
	}
}
