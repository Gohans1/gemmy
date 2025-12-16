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
	playPauseButtonEl: HTMLElement;
	toggleModeButtonEl: HTMLElement;
	viewAllButtonEl: HTMLElement;
	bubbleTimeout: number;
	idleIntervalId: number;
	appeared = false;
	quoteHistory: string[] = [];
	historyIndex = 0;
	timerInterval: number | null = null;
	pomodoroTimeLeft = 0;
	focusVolumeSliderEl: HTMLInputElement;
	isPlayingMusic = false;
    currentMusicId: string | null = null;

	aSync onload() {
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
			text: UI_TEXT.ICONS.PAUSE,
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
			if (path.startsWith("http://") || path.startsWith("https://")) {
				return path;
			}
			if (path.startsWith("file://") || path.startsWith("app://")) {
				return path;
			}
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

            // --- FOCUS MODE UI SETUP ---
            this.bubbleContentEl.empty();

            // 1. Timer Container
            const timerContainer = this.bubbleContentEl.createDiv("gemmy-focus-timer-container");
            timerContainer.style.display = "flex";
            timerContainer.style.alignItems = "center";
            timerContainer.style.justifyContent = "center";
            timerContainer.style.gap = "5px";
            timerContainer.style.marginBottom = "5px";

            timerContainer.createSpan({text: UI_TEXT.ICONS.FOCUS_ON}); // Icon

            // Editable Timer
            const timerInput = timerContainer.createEl("input", {
                type: "number",
                cls: "gemmy-focus-timer-input"
            });
            timerInput.style.width = "50px";
            timerInput.style.background = "transparent";
            timerInput.style.border = "none";
            timerInput.style.textAlign = "center";
            timerInput.style.fontWeight = "bold";
            timerInput.style.fontSize = "1.2em";

            // Initial Time
            const defaultMins = this.dataManager.settings.focusDuration || 25;
            this.pomodoroTimeLeft = defaultMins * 60;

            // Update Timer UI helper
            const updateTimerUI = () => {
                const mins = Math.floor(this.pomodoroTimeLeft / 60);
                timerInput.value = mins.toString();
            };
            updateTimerUI();

            // Allow changing time on the fly
            timerInput.onchange = () => {
                const newMins = parseInt(timerInput.value);
                if(!isNaN(newMins) && newMins > 0) {
                    this.pomodoroTimeLeft = newMins * 60;
                }
            };

            // 2. Music Selector
            const musicSelector = this.bubbleContentEl.createEl("select", {
                cls: "gemmy-music-selector"
            });
            musicSelector.style.width = "100%";
            musicSelector.style.marginBottom = "5px";
            musicSelector.style.fontSize = "0.9em";

            const playlist = this.dataManager.settings.playlist || [];
            if(playlist.length > 0) {
                playlist.forEach(track => {
                    const opt = musicSelector.createEl("option", {
                        text: track.name,
                        value: track.id
                    });
                });

                // Play first track by default
                this.currentMusicId = playlist[0].id;
                this.playFocusMusic(this.currentMusicId);

                // Change track event
                musicSelector.onchange = () => {
                    this.currentMusicId = musicSelector.value;
                    this.playFocusMusic(this.currentMusicId);
                };
            } else {
                const opt = musicSelector.createEl("option", {text: "No music in playlist"});
                musicSelector.disabled = true;
            }

            // --- END FOCUS MODE UI SETUP ---

			this.focusVolumeSliderEl.removeClass(CSS_CLASSES.HIDDEN);
			this.playPauseButtonEl.removeClass("hidden");
			setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
			this.isPlayingMusic = true;

			this.startPomodoro(timerInput); // Pass input to update it

		} else {
			this.focusButtonEl.innerText = UI_TEXT.ICONS.FOCUS_OFF;
			new Notice(NOTICES.FOCUS_MODE_OFF);
			this.stopPomodoro();
			this.stopFocusMusic();
			this.imageEl.style.opacity = "1";
			this.focusVolumeSliderEl.addClass(CSS_CLASSES.HIDDEN);
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

	playFocusMusic(videoId?: string) {
        // If no ID provided, try to use current or first in playlist
        if (!videoId) {
            const playlist = this.dataManager.settings.playlist || [];
            if(playlist.length > 0) videoId = playlist[0].id;
            else return; // No music to play
        }

		// Remove existing player if any (to switch tracks)
        this.stopFocusMusic();

		if (videoId) {
			const iframe = document.createElement("iframe");
			iframe.id = "gemmy-focus-music-player";
			iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&enablejsapi=1&controls=0&origin=${window.location.origin}`;

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
		const iframe = document.getElementById("gemmy-focus-music-player");
		if (iframe) iframe.remove();
	}

	startPomodoro(displayInput?: HTMLInputElement) {
		this.stopPomodoro();
		this.timerInterval = window.setInterval(() => {
			this.pomodoroTimeLeft--;
			if (this.pomodoroTimeLeft <= 0) {
				this.stopPomodoro();
				this.bubbleContentEl.empty();
                this.bubbleContentEl.createDiv({text: "Time's up! Take a break! 🍅", cls: "gemmy-focus-finished"});
                // Reset UI after 5 seconds or click?
                // For now just leave it message
			} else {
                if(displayInput) {
                    // Only update display every minute change to allow editing?
                    // No, update continuously but maybe format as MM:SS?
                    // User wanted "input minutes".
                    // Let's stick to MM:SS display in the input? No, input type=number handles numbers best.
                    // Actually, let's switch display to a Span for Countdown and Input for setting.
                    // Re-eval: User wants "custom timer".
                    // Implementation in toggleFocusMode used input type="number".
                    // Let's update that input to show remaining minutes rounded up?
                    // Or better: Replace input with countdown text when running?

                    // Simple approach: Update value to minutes remaining
                    const mins = Math.ceil(this.pomodoroTimeLeft / 60);
                    if(document.activeElement !== displayInput) {
                        displayInput.value = mins.toString();
                    }
                }
			}
		}, 1000);
	}

	stopPomodoro() {
		if (this.timerInterval) {
			window.clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

    // Deprecated but kept if needed for reference, though new UI handles display
	updatePomodoroDisplay() {
        // Logic moved to startPomodoro callback
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

        this.bubbleContentEl.empty(); // Clear focus UI if any
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
