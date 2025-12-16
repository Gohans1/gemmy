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
	SetFocusMusicModal,
} from "./modals";

export default class Gemmy extends Plugin {
	dataManager: DataManager;
	isFavouriteMode = false; // Default to Normal Mode
	isFocusMode = false;
	gemmyEl: HTMLElement;
	imageEl: HTMLElement;
	chatBubbleEl: HTMLElement;
	bubbleContentEl: HTMLElement;
	nextButtonEl: HTMLElement;
	previousButtonEl: HTMLElement;
	menuButtonEl: HTMLElement;
	exportButtonEl: HTMLElement;
	favoriteButtonEl: HTMLElement;
	focusButtonEl: HTMLElement;
	playPauseButtonEl: HTMLElement; // New Play/Pause button
	toggleModeButtonEl: HTMLElement; // Button to switch modes
	viewAllButtonEl: HTMLElement;
	bubbleTimeout: number;
	idleIntervalId: number;
	appeared = false;
	quoteHistory: string[] = [];
	historyIndex = 0;
	timerInterval: number | null = null;
	pomodoroTimeLeft = 0;
	focusVolumeSliderEl: HTMLInputElement; // New volume slider
	isPlayingMusic = false;

	async onload() {
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

		// Focus Music Volume Slider (Hidden by default)
		this.focusVolumeSliderEl = this.chatBubbleEl.createEl("input", {
			type: "range",
			cls: "gemmy-volume-slider hidden",
		});
		this.focusVolumeSliderEl.min = "0";
		this.focusVolumeSliderEl.max = "100";
		this.focusVolumeSliderEl.value = "50"; // Default 50%
		this.focusVolumeSliderEl.oninput = (e) => {
			// @ts-ignore
			const volume = parseInt(e.target.value);
			this.setMusicVolume(volume);
		};

		const buttonContainer = this.chatBubbleEl.createDiv({
			cls: CSS_CLASSES.GEMMY_BUTTON_CONTAINER,
		});

		// Play/Pause Button (initially hidden)
		this.playPauseButtonEl = buttonContainer.createEl("button", {
			cls: "gemmy-play-pause-button hidden",
			text: UI_TEXT.ICONS.PAUSE, // Default to Pause icon since it auto-plays
		});
		setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
		this.playPauseButtonEl.setAttribute("data-tooltip", "Pause Music");
		this.playPauseButtonEl.onclick = () => this.toggleMusicPlayback();

		this.focusButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.FOCUS_BUTTON,
			text: UI_TEXT.ICONS.FOCUS_OFF,
		});
		this.focusButtonEl.setAttribute(
			"data-tooltip",
			COMMANDS.TOGGLE_FOCUS_MODE.name,
		);

		this.toggleModeButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.TOGGLE_MODE_BUTTON,
			text: UI_TEXT.ICONS.NORMAL_MODE,
		});
		this.toggleModeButtonEl.setAttribute(
			"data-tooltip",
			UI_TEXT.LABELS.SWITCH_TO_FAV_MODE,
		);

		this.favoriteButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.FAVORITE_BUTTON,
			text: UI_TEXT.ICONS.HEART_EMPTY,
		});

		this.menuButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.MENU_BUTTON,
		});
		setIcon(this.menuButtonEl, UI_TEXT.ICONS.MENU);
		this.menuButtonEl.setAttribute("data-tooltip", UI_TEXT.LABELS.MENU);

		this.previousButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.NEXT_BUTTON,
			text: UI_TEXT.BUTTONS.PREV,
		});

		this.nextButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.NEXT_BUTTON,
			text: UI_TEXT.BUTTONS.NEXT,
		});

		this.focusButtonEl.onclick = () => this.toggleFocusMode();

		this.toggleModeButtonEl.onclick = () => {
			this.isFavouriteMode = !this.isFavouriteMode;
			if (this.isFavouriteMode) {
				if (this.dataManager.favoriteQuotes.length === 0) {
					new Notice(NOTICES.NO_FAVORITES_YET);
					this.isFavouriteMode = false;
					return;
				}
				this.toggleModeButtonEl.innerText = UI_TEXT.ICONS.FAVORITE_MODE;
				this.toggleModeButtonEl.setAttribute(
					"data-tooltip",
					UI_TEXT.LABELS.SWITCH_TO_NORMAL_MODE,
				);
				new Notice(NOTICES.SWITCHED_TO_FAV);
			} else {
				this.toggleModeButtonEl.innerText = UI_TEXT.ICONS.NORMAL_MODE;
				this.toggleModeButtonEl.setAttribute(
					"data-tooltip",
					UI_TEXT.LABELS.SWITCH_TO_FAV_MODE,
				);
				new Notice(NOTICES.SWITCHED_TO_NORMAL);
			}
			this.saySomething(); // Refresh quote immediately
		};

		this.favoriteButtonEl.onclick = async () => {
			const currentQuote = this.bubbleContentEl.innerText;
			const added = await this.dataManager.toggleFavorite(currentQuote);

			if (added) {
				this.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_FILLED;
				new Notice(NOTICES.ADDED_TO_FAVORITES);
			} else {
				this.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_EMPTY;
				new Notice(NOTICES.REMOVED_FROM_FAVORITES);
			}
		};

		this.menuButtonEl.onclick = (event: MouseEvent) => {
			const menu = new Menu();

			// --- GROUP 1: CURRENT INTERACTION ---
			menu.addItem((item) =>
				item
					.setTitle(UI_TEXT.MENU_ITEMS.COPY_CURRENT)
					.setIcon(UI_TEXT.ICONS.COPY)
					.onClick(() => {
						navigator.clipboard
							.writeText(this.bubbleContentEl.innerText)
							.then(() => new Notice(NOTICES.COPIED));
					}),
			);

			menu.addSeparator();

			// --- GROUP 2: CONTENT MANAGEMENT ---
			menu.addItem((item) =>
				item
					.setTitle(UI_TEXT.MENU_ITEMS.VIEW_FAVORITES)
					.setIcon(UI_TEXT.ICONS.STAR)
					.onClick(() => {
						new ViewFavoritesModal(
							this.app,
							this.dataManager,
						).open();
					}),
			);

			menu.addItem((item) =>
				item
					.setTitle(UI_TEXT.MENU_ITEMS.VIEW_ALL)
					.setIcon(UI_TEXT.ICONS.DOCUMENTS)
					.onClick(() => {
						new ViewAllQuotesModal(
							this.app,
							this.dataManager,
						).open();
					}),
			);

			menu.addItem((item) =>
				item
					.setTitle(UI_TEXT.MENU_ITEMS.ADD_NEW)
					.setIcon(UI_TEXT.ICONS.PLUS_CIRCLE)
					.onClick(() => {
						new AddUserQuoteModal(this.app, async (newQuote) => {
							const success =
								await this.dataManager.addQuote(newQuote);
							if (success) {
								new Notice(NOTICES.NEW_QUOTE_SAVED);
							} else {
								new Notice(NOTICES.QUOTE_EXISTS);
							}
						}).open();
					}),
			);

			menu.addItem((item) =>
				item
					.setTitle(UI_TEXT.MENU_ITEMS.IMPORT)
					.setIcon(UI_TEXT.ICONS.UPLOAD)
					.onClick(() => {
						new ImportModal(this.app, this.dataManager).open();
					}),
			);

			menu.addItem((item) =>
				item
					.setTitle(UI_TEXT.MENU_ITEMS.EXPORT)
					.setIcon(UI_TEXT.ICONS.DOWNLOAD)
					.onClick(() => {
						this.exportQuotes();
					}),
			);

			menu.addSeparator();

			// --- GROUP 3: SYSTEM ---
			menu.addItem((item) =>
				item
					.setTitle(UI_TEXT.MENU_ITEMS.SET_MUSIC)
					.setIcon(UI_TEXT.ICONS.HEADPHONES)
					.onClick(() => {
						new SetFocusMusicModal(
							this.app,
							this.dataManager,
						).open();
					}),
			);

			menu.addItem((item) =>
				item
					.setTitle(UI_TEXT.MENU_ITEMS.CHANGE_AVATAR)
					.setIcon(UI_TEXT.ICONS.IMAGE)
					.onClick(() => {
						new ChangeAvatarModal(
							this.app,
							this.dataManager,
							() => {
								// Refresh the image immediately if gemmy is visible
								if (this.appeared) {
									this.imageEl.setAttribute(
										"src",
										this.getAvatarSource(),
									);
								}
							},
						).open();
					}),
			);

			menu.addItem((item) =>
				item
					.setTitle(UI_TEXT.MENU_ITEMS.CHANGE_FREQUENCY)
					.setIcon(UI_TEXT.ICONS.CLOCK)
					.onClick(() => {
						new ChangeFrequencyModal(
							this.app,
							this.dataManager,
							() => this.resetIdleInterval(),
						).open();
					}),
			);

			menu.addItem((item) =>
				item
					.setTitle(UI_TEXT.MENU_ITEMS.HIDE_GEMMY)
					.setIcon(UI_TEXT.ICONS.EYE_OFF)
					.onClick(() => {
						this.disappear();
					}),
			);

			menu.showAtMouseEvent(event);
		};

		this.previousButtonEl.onclick = () => {
			if (this.historyIndex < this.quoteHistory.length - 1) {
				this.historyIndex++;
				const prevQuote = this.quoteHistory[this.historyIndex];
				this.bubbleContentEl.innerText = prevQuote;

				this.updateFavoriteButtonState(prevQuote);
			} else {
				new Notice(NOTICES.NO_MORE_HISTORY);
			}
		};

		this.nextButtonEl.onclick = () => {
			if (this.historyIndex > 0) {
				this.historyIndex--;
				const nextQuote = this.quoteHistory[this.historyIndex];
				this.bubbleContentEl.innerText = nextQuote;

				this.updateFavoriteButtonState(nextQuote);
			} else {
				this.saySomething();
			}
			this.resetIdleInterval();
		};

		this.addCommand({
			id: COMMANDS.VIEW_ALL_QUOTES.id,
			name: COMMANDS.VIEW_ALL_QUOTES.name,
			callback: () => {
				new ViewAllQuotesModal(this.app, this.dataManager).open();
			},
		});

		this.addCommand({
			id: COMMANDS.SHOW_GEMMY.id,
			name: COMMANDS.SHOW_GEMMY.name,
			callback: () => this.appear(),
		});

		this.addCommand({
			id: COMMANDS.EXPORT_ALL_QUOTES.id,
			name: COMMANDS.EXPORT_ALL_QUOTES.name,
			callback: () => this.exportQuotes(),
		});

		this.addCommand({
			id: COMMANDS.ADD_QUOTE.id,
			name: COMMANDS.ADD_QUOTE.name,
			callback: () => {
				new AddQuoteModal(this.app, async (newQuotes) => {
					const count = await this.dataManager.addQuotes(newQuotes);
					new Notice(NOTICES.NEW_QUOTES_SAVED(count));
				}).open();
			},
		});

		this.addCommand({
			id: COMMANDS.VIEW_FAVORITE_QUOTES.id,
			name: COMMANDS.VIEW_FAVORITE_QUOTES.name,
			callback: () => {
				new ViewFavoritesModal(this.app, this.dataManager).open();
			},
		});

		this.addCommand({
			id: COMMANDS.IMPORT_QUOTES.id,
			name: COMMANDS.IMPORT_QUOTES.name,
			callback: () => {
				new ImportModal(this.app, this.dataManager).open();
			},
		});

		this.addCommand({
			id: COMMANDS.TOGGLE_FOCUS_MODE.id,
			name: COMMANDS.TOGGLE_FOCUS_MODE.name,
			callback: () => this.toggleFocusMode(),
		});

		this.addSettingTab(
			new GemmySettingTab(this.app, this, this.dataManager),
		);
		this.resetIdleInterval();
		this.makeDraggable(this.gemmyEl);
		app.workspace.onLayoutReady(this.appear.bind(this));
	}

	exportQuotes() {
		const dataToExport = JSON.stringify(
			{ quotes: this.dataManager.allQuotes },
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
			// Check if it's a URL
			if (path.startsWith("http://") || path.startsWith("https://")) {
				return path;
			}
			// Check if it's already a file URL
			if (path.startsWith("file://") || path.startsWith("app://")) {
				return path;
			}
			// Assume local path, convert to resource URL for Electron
			// On Obsidian, app://local/ is preferred for local files outside vault,
			// but file:/// might work depending on security settings.
			// Let's try to convert to a valid file URL first as it's more standard.
			// Windows path: C:\Users... -> file:///C:/Users...
			// Unix path: /Users... -> file:///Users...

			// Simple conversion
			let normalizedPath = path.replace(/\\/g, "/");
			if (!normalizedPath.startsWith("/")) {
				normalizedPath = "/" + normalizedPath;
			}
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
		this.bubbleTimeout && clearTimeout(this.bubbleTimeout);
		this.chatBubbleEl.addClass(CSS_CLASSES.HIDDEN);
		this.gemmyEl.hide();
		this.appeared = false;
	}

	updateFavoriteButtonState(quote: string) {
		if (this.dataManager.isFavorite(quote)) {
			this.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_FILLED;
		} else {
			this.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_EMPTY;
		}
	}

	toggleFocusMode() {
		this.isFocusMode = !this.isFocusMode;
		const buttonContainer = this.chatBubbleEl.querySelector(
			`.${CSS_CLASSES.GEMMY_BUTTON_CONTAINER}`,
		);

		if (this.isFocusMode) {
			if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout); // Prevent auto-hide
			this.focusButtonEl.innerText = UI_TEXT.ICONS.FOCUS_ON;
			new Notice(NOTICES.FOCUS_MODE_ON);
			this.imageEl.style.opacity = "1";
			if (buttonContainer) buttonContainer.addClass("focus-mode-active");
			this.focusVolumeSliderEl.removeClass(CSS_CLASSES.HIDDEN); // Show slider

			// Show Play/Pause button
			this.playPauseButtonEl.removeClass("hidden");
			setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE); // Reset to pause (playing)
			this.isPlayingMusic = true;

			this.startPomodoro();

			// Play focus music internally
			this.playFocusMusic();
		} else {
			this.focusButtonEl.innerText = UI_TEXT.ICONS.FOCUS_OFF;
			new Notice(NOTICES.FOCUS_MODE_OFF);
			this.stopPomodoro();
			this.stopFocusMusic();
			this.imageEl.style.opacity = "1";
			this.focusVolumeSliderEl.addClass(CSS_CLASSES.HIDDEN); // Hide slider

			// Hide Play/Pause button
			this.playPauseButtonEl.addClass("hidden");

			if (buttonContainer)
				buttonContainer.removeClass("focus-mode-active");
			this.saySomething();
		}
	}

	toggleMusicPlayback() {
		if (this.isPlayingMusic) {
			this.sendYouTubeCommand("pauseVideo", []);
			setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PLAY);
			this.playPauseButtonEl.setAttribute("data-tooltip", "Play Music");
			this.isPlayingMusic = false;
		} else {
			this.sendYouTubeCommand("playVideo", []);
			setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
			this.playPauseButtonEl.setAttribute("data-tooltip", "Pause Music");
			this.isPlayingMusic = true;
		}
	}

	playFocusMusic() {
		const musicUrl = this.dataManager.settings.focusMusicUrl;
		if (!musicUrl || musicUrl.trim() === "") {
			// If no music URL, hide play button to avoid confusion
			this.playPauseButtonEl.addClass("hidden");
			return;
		}

		// Extract YouTube Video ID
		const videoId = this.extractYouTubeId(musicUrl);

		if (videoId) {
			// Create hidden iframe for YouTube
			const iframe = document.createElement("iframe");
			iframe.id = "gemmy-focus-music-player";
			// enablejsapi=1 is crucial for postMessage control
			// origin is needed for some CORS policies on postMessage
			iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&enablejsapi=1&controls=0&origin=${window.location.origin}`;

			// DO NOT use display: none, it blocks autoplay in some environments
			iframe.style.width = "1px";
			iframe.style.height = "1px";
			iframe.style.opacity = "0.01";
			iframe.style.position = "absolute";
			iframe.style.top = "-9999px";
			iframe.style.left = "-9999px";
			iframe.style.pointerEvents = "none";
			iframe.setAttribute("tabindex", "-1");

			iframe.allow = "autoplay; encrypted-media";
			document.body.appendChild(iframe);

			// Optimize: Force 144p quality after it loads
			iframe.onload = () => {
				// We need a slight delay to ensure player is ready to receive messages
				setTimeout(() => {
					this.sendYouTubeCommand("setPlaybackQuality", ["small"]);
					this.sendYouTubeCommand("playVideo", []); // Force play

					// Set initial volume from slider
					// @ts-ignore
					const vol = parseInt(this.focusVolumeSliderEl.value);
					this.setMusicVolume(vol);
				}, 1500); // Increased delay slightly
			};
		}
	}
	setMusicVolume(volume: number) {
		this.sendYouTubeCommand("setVolume", [volume]);
	}

	sendYouTubeCommand(func: string, args: any[]) {
		const iframe = document.getElementById(
			"gemmy-focus-music-player",
		) as HTMLIFrameElement;
		if (iframe && iframe.contentWindow) {
			iframe.contentWindow.postMessage(
				JSON.stringify({
					event: "command",
					func: func,
					args: args,
				}),
				"*",
			);
		}
	}

	stopFocusMusic() {
		// Remove YouTube iframe
		const iframe = document.getElementById("gemmy-focus-music-player");
		if (iframe) iframe.remove();
	}

	extractYouTubeId(url: string): string | null {
		const regExp =
			/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
		const match = url.match(regExp);
		return match && match[2].length === 11 ? match[2] : null;
	}

	startPomodoro() {
		this.stopPomodoro();
		this.pomodoroTimeLeft = CONSTANTS.POMODORO_DURATION;
		this.updatePomodoroDisplay();
		this.chatBubbleEl.removeClass(CSS_CLASSES.HIDDEN);

		this.timerInterval = window.setInterval(() => {
			this.pomodoroTimeLeft--;
			if (this.pomodoroTimeLeft <= 0) {
				this.stopPomodoro();
				this.bubbleContentEl.innerText = "Time's up! Take a break! 🍅";
			} else {
				this.updatePomodoroDisplay();
			}
		}, 1000);
	}

	stopPomodoro() {
		if (this.timerInterval) {
			window.clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	updatePomodoroDisplay() {
		const minutes = Math.floor(this.pomodoroTimeLeft / 60);
		const seconds = this.pomodoroTimeLeft % 60;
		const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
			.toString()
			.padStart(2, "0")}`;
		this.bubbleContentEl.innerText = `${UI_TEXT.ICONS.FOCUS_ON} ${timeString}`;
	}

	saySomething() {
		if (!this.appeared) return;
		if (this.isFocusMode) return;
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
		const randomThing =
			sourceQuotes[Math.floor(Math.random() * sourceQuotes.length)];
		this.quoteHistory.unshift(randomThing);
		if (this.quoteHistory.length > 5) this.quoteHistory.pop();

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
