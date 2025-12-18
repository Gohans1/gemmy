import { Notice, setIcon, Menu } from "obsidian";
import type Gemmy from "../main";
import { UI_TEXT, NOTICES, CSS_CLASSES, COMMANDS } from "../constants";
import { FocusSettingsModal } from "../modals";

export class FocusManager {
	plugin: Gemmy;
	isFocusMode = false;

	// UI Elements managed by FocusManager
	focusVolumeSliderEl: HTMLInputElement;
	musicSelectEl: HTMLSelectElement;
	playPauseButtonEl: HTMLElement;
	randomButtonEl: HTMLElement;
	focusSettingsButtonEl: HTMLElement;
	focusButtonEl: HTMLElement;

	// Timer State
	timerInterval: number | null = null;
	pomodoroTimeLeft = 0;
	isTimerRunning = false;
	isTimerPaused = false;

	// Music State
	isPlayingMusic = false;
	currentMusicId: string | null = null;

	constructor(plugin: Gemmy) {
		this.plugin = plugin;
	}

	initFocusControls(container: HTMLElement, buttonContainer: HTMLElement) {
		// --- FOCUS MODE CONTROLS ---
		const focusControlsContainer = container.createDiv({
			cls: "gemmy-focus-controls-container hidden gemmy-focus-controls",
		});

		// Music Selector Dropdown
		this.musicSelectEl = focusControlsContainer.createEl("select", {
			cls: "gemmy-music-selector",
		});
		this.musicSelectEl.onchange = (e) => {
			// @ts-ignore
			const selectedValue = e.target.value;
			if (selectedValue) {
				this.currentMusicId = selectedValue;
				this.playFocusMusic(selectedValue);
				this.isPlayingMusic = true;
				setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
			}
		};

		// Play/Pause Button
		this.playPauseButtonEl = focusControlsContainer.createEl("button", {
			cls: "gemmy-play-pause-button clickable-icon",
		});
		setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
		this.playPauseButtonEl.setAttribute("data-tooltip", "Pause Music");
		this.playPauseButtonEl.onclick = () => this.toggleMusicPlayback();

		// Random Button
		this.randomButtonEl = focusControlsContainer.createEl("button", {
			cls: "gemmy-random-button clickable-icon",
		});
		setIcon(this.randomButtonEl, "dice");
		this.randomButtonEl.setAttribute("data-tooltip", "Random Music");
		this.randomButtonEl.onclick = () => this.playRandomMusic();

		// Volume Slider
		this.focusVolumeSliderEl = container.createEl("input", {
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

		// Focus Settings Button
		this.focusSettingsButtonEl = buttonContainer.createEl("button", {
			cls: "gemmy-focus-settings-button clickable-icon hidden",
		});
		setIcon(this.focusSettingsButtonEl, "settings");
		this.focusSettingsButtonEl.setAttribute(
			"data-tooltip",
			"Focus Settings & Music",
		);
		this.focusSettingsButtonEl.onclick = () => {
			new FocusSettingsModal(
				this.plugin.app,
				this.plugin.dataManager,
				(selectedValue) => {
					this.populateMusicList();
					this.currentMusicId = selectedValue;
					this.musicSelectEl.value = selectedValue;
					this.playFocusMusic(selectedValue);
					this.isPlayingMusic = true;
					setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
				},
			).open();
		};

		// Focus Toggle Button
		this.focusButtonEl = buttonContainer.createEl("button", {
			cls: `${CSS_CLASSES.FOCUS_BUTTON} clickable-icon`,
			text: UI_TEXT.ICONS.FOCUS_OFF,
		});
		this.focusButtonEl.setAttribute(
			"data-tooltip",
			COMMANDS.TOGGLE_FOCUS_MODE.name,
		);
		this.focusButtonEl.onclick = () => this.toggleFocusMode();

		// Populate music list initially
		this.populateMusicList();
	}

	playRandomMusic() {
		const tracks = this.plugin.dataManager.settings.focusTracks || [];

		// Create pool of options
		const options: string[] = [];

		// Add Tracks IDs
		tracks.forEach((t) => options.push(t.id));

		if (options.length === 0) {
			new Notice("Gemmy: No music available to random!");
			return;
		}

		const randomIndex = Math.floor(Math.random() * options.length);
		const selectedId = options[randomIndex];

		// Update selection and play
		this.currentMusicId = selectedId;
		if (this.musicSelectEl) {
			this.musicSelectEl.value = selectedId;
		}

		this.playFocusMusic(selectedId);
		this.isPlayingMusic = true;
		setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);

		new Notice("Gemmy: Playing random selection 🎲");
	}

	populateMusicList() {
		if (!this.musicSelectEl) return;
		this.musicSelectEl.empty();

		const tracks = this.plugin.dataManager.settings.focusTracks || [];

		if (tracks.length > 0) {
			// Add Tracks
			tracks.forEach((track) => {
				this.musicSelectEl.createEl("option", {
					text: track.name,
					value: track.id, // Legacy support: track IDs are stored directly
				});
			});
		} else {
			this.musicSelectEl.createEl("option", {
				text: "No music available",
				value: "",
			});
		}
	}

	toggleFocusMode() {
		this.isFocusMode = !this.isFocusMode;

		const buttonContainer = this.plugin.chatBubbleEl.querySelector(
			`.${CSS_CLASSES.GEMMY_BUTTON_CONTAINER}`,
		);
		const focusControlsContainer = this.plugin.chatBubbleEl.querySelector(
			".gemmy-focus-controls-container",
		);

		if (this.isFocusMode) {
			if (this.plugin.quoteManager && this.plugin.quoteManager.bubbleTimeout)
				clearTimeout(this.plugin.quoteManager.bubbleTimeout);
			this.focusButtonEl.innerText = UI_TEXT.ICONS.FOCUS_ON;
			new Notice(NOTICES.FOCUS_MODE_ON);
			this.plugin.imageEl.style.opacity = "1";
			if (buttonContainer) buttonContainer.addClass("gemmy-focus-active");

			// Hide Normal Buttons
			this.plugin.toggleModeButtonEl.addClass("hidden");
			this.plugin.favoriteButtonEl.addClass("hidden");
			this.plugin.menuButtonEl.addClass("hidden");
			this.plugin.previousButtonEl.addClass("hidden");
			this.plugin.nextButtonEl.addClass("hidden");

			// Show Focus Buttons
			this.focusVolumeSliderEl.removeClass("hidden");
			this.focusSettingsButtonEl.removeClass("hidden");
			if (focusControlsContainer)
				focusControlsContainer.removeClass("hidden");

			// Init Timer State
			const defaultMins =
				this.plugin.dataManager.settings.focusDuration || 25;
			this.pomodoroTimeLeft = defaultMins * 60;
			this.isTimerRunning = false;
			this.renderFocusUI();

			// --- AUTO-PLAY MUSIC LOGIC ---
			this.populateMusicList();

			// Select last played or first available
			let targetId = this.currentMusicId;

			// Verify target still exists in either list
			const tracks = this.plugin.dataManager.settings.focusTracks || [];

			let exists = false;
			if (targetId) {
				exists = tracks.some((t) => t.id === targetId);
			}

			if (!exists) {
				if (tracks.length > 0) {
					targetId = tracks[0].id;
				} else {
					targetId = null;
				}
			}

			if (targetId) {
				this.currentMusicId = targetId;
				this.musicSelectEl.value = targetId;
				this.playFocusMusic(targetId);
				this.isPlayingMusic = true;
				setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
			} else {
				this.currentMusicId = null;
				this.stopFocusMusic();
				this.isPlayingMusic = false;
				setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PLAY);
			}
		} else {
			this.focusButtonEl.innerText = UI_TEXT.ICONS.FOCUS_OFF;
			new Notice(NOTICES.FOCUS_MODE_OFF);
			this.stopPomodoro();
			this.stopFocusMusic();
			this.plugin.imageEl.style.opacity = "1";

			if (buttonContainer)
				buttonContainer.removeClass("gemmy-focus-active");

			// Hide Focus Buttons
			this.focusVolumeSliderEl.addClass("hidden");
			this.focusSettingsButtonEl.addClass("hidden");
			if (focusControlsContainer)
				focusControlsContainer.addClass("hidden");

			// Show Normal Buttons
			this.plugin.toggleModeButtonEl.removeClass("hidden");
			this.plugin.favoriteButtonEl.removeClass("hidden");
			this.plugin.menuButtonEl.removeClass("hidden");
			this.plugin.previousButtonEl.removeClass("hidden");
			this.plugin.nextButtonEl.removeClass("hidden");

			this.plugin.quoteManager.saySomething();
		}
	}

	renderFocusUI() {
		this.plugin.bubbleContentEl.empty();

		const container = this.plugin.bubbleContentEl.createDiv(
			"gemmy-focus-ui gemmy-focus-ui-container",
		);

		if (!this.isTimerRunning) {
			// SETUP MODE
			const input = container.createEl("input", {
				type: "text",
				cls: "gemmy-timer-input",
			});

			const minutes = Math.floor(this.pomodoroTimeLeft / 60);
			const seconds = this.pomodoroTimeLeft % 60;

			input.value = `${minutes.toString().padStart(2, "0")}:${seconds
				.toString()
				.padStart(2, "0")}`;

			input.placeholder = "25:00";

			const parseTime = (val: string): number | null => {
				const v = val.trim();
				if (v.includes(":")) {
					const parts = v.split(":");
					if (parts.length === 2) {
						const m = parseInt(parts[0]);
						const s = parseInt(parts[1]);
						if (!isNaN(m) && !isNaN(s)) {
							return m * 60 + s;
						}
					}
				} else {
					const m = parseInt(v);
					if (!isNaN(m)) {
						return m * 60;
					}
				}
				return null;
			};

			input.onchange = () => {
				const seconds = parseTime(input.value);
				if (seconds !== null && seconds > 0) {
					this.pomodoroTimeLeft = seconds;
				}
			};

			const startBtn = container.createEl("button", {
				cls: "clickable-icon",
			});
			setIcon(startBtn, "play");
			startBtn.setAttribute("aria-label", "Start Timer");
			startBtn.onclick = () => {
				const seconds = parseTime(input.value);
				if (seconds !== null && seconds > 0) {
					this.pomodoroTimeLeft = seconds;
					this.startPomodoro();
				}
			};
		} else {
			// RUNNING MODE
			const minutes = Math.floor(this.pomodoroTimeLeft / 60);
			const seconds = this.pomodoroTimeLeft % 60;
			const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

			container.createSpan({ text: timeStr });

			// Pause/Resume Button
			const pauseResumeBtn = container.createEl("button", {
				cls: "clickable-icon",
			});
			if (this.isTimerPaused) {
				setIcon(pauseResumeBtn, "play");
				pauseResumeBtn.setAttribute("aria-label", "Resume Timer");
				pauseResumeBtn.onclick = () => this.resumePomodoro();
			} else {
				setIcon(pauseResumeBtn, "pause");
				pauseResumeBtn.setAttribute("aria-label", "Pause Timer");
				pauseResumeBtn.onclick = () => this.pausePomodoro();
			}

			// Stop Button
			const stopBtn = container.createEl("button", {
				cls: "clickable-icon",
			});
			setIcon(stopBtn, "square");
			stopBtn.setAttribute("aria-label", "Stop Timer");
			stopBtn.onclick = () => {
				this.stopPomodoro();
				this.renderFocusUI();
			};
		}
	}

	startPomodoro() {
		this.isTimerRunning = true;
		this.isTimerPaused = false;
		this.renderFocusUI();

		if (this.timerInterval) clearInterval(this.timerInterval);
		this.timerInterval = window.setInterval(() => {
			this.pomodoroTimeLeft--;
			if (this.pomodoroTimeLeft <= 0) {
				this.stopPomodoro();
				this.plugin.bubbleContentEl.empty();
				this.plugin.bubbleContentEl.createDiv({
					text: "Time's up! 🍅",
					cls: "gemmy-focus-finished",
				});
				new Notice("Gemmy: Session Finished!");
			} else {
				const container =
					this.plugin.bubbleContentEl.querySelector(
						".gemmy-focus-ui",
					);
				if (container) {
					const span = container.querySelector("span");
					if (span) {
						const minutes = Math.floor(this.pomodoroTimeLeft / 60);
						const seconds = this.pomodoroTimeLeft % 60;
						const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
						span.innerText = timeStr;
					} else {
						this.renderFocusUI();
					}
				}
			}
		}, 1000);
	}

	pausePomodoro() {
		this.isTimerPaused = true;
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
		this.renderFocusUI();
	}

	resumePomodoro() {
		this.startPomodoro();
	}

	stopPomodoro() {
		this.isTimerRunning = false;
		this.isTimerPaused = false;
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	playFocusMusic(idOrValue: string) {
		this.stopFocusMusic();
		if (!idOrValue) return;

		let src = "";

		// Assume it's a track ID
		src = `https://www.youtube.com/embed/${idOrValue}?autoplay=1&loop=1&playlist=${idOrValue}&enablejsapi=1&mute=0&rel=0`;
		console.log("Gemmy: Playing track", idOrValue);

		const iframe = document.createElement("iframe");
		iframe.id = "gemmy-focus-music-player";
		iframe.className = "gemmy-hidden-iframe";
		iframe.src = src;
		iframe.allow = "autoplay; encrypted-media";
		document.body.appendChild(iframe);

		iframe.onload = () => {
			console.log("Gemmy: Music player iframe loaded.");
			const retryDuration = 6000;
			const intervalTime = 1000;
			let elapsed = 0;

			const intervalId = window.setInterval(() => {
				// Base commands
				this.sendYouTubeCommand("unMute", []);
				this.sendYouTubeCommand("setPlaybackQuality", ["small"]);
				this.sendYouTubeCommand("playVideo", []);

				// Set volume
				const vol = this.focusVolumeSliderEl
					? parseInt(this.focusVolumeSliderEl.value)
					: 50;
				this.setMusicVolume(vol);

				elapsed += intervalTime;
				if (elapsed >= retryDuration) {
					window.clearInterval(intervalId);
				}
			}, intervalTime);
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
		const iframe = document.getElementById(
			"gemmy-focus-music-player",
		) as HTMLIFrameElement;
		if (iframe && iframe.contentWindow) {
			iframe.contentWindow.postMessage(
				JSON.stringify({ event: "command", func: func, args: args }),
				"*",
			);
		}
	}

	stopFocusMusic() {
		const iframe = document.getElementById("gemmy-focus-music-player");
		if (iframe) iframe.remove();
	}

	unload() {
		this.stopPomodoro();
		this.stopFocusMusic();
	}
}
