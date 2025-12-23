import { Notice, setIcon } from "obsidian";
import type Gemmy from "../main";
import { UI_TEXT, NOTICES, CSS_CLASSES, CONSTANTS } from "../constants";
import { FocusSettingsModal } from "../modals";

const YT_ORIGIN = "https://www.youtube.com";

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
	musicDuration = 0;
	isPlayerReady = false;
	private playerIframe: HTMLIFrameElement | null = null;

	// Bound listener for removal
	private messageListener: (event: MessageEvent) => void;

	constructor(plugin: Gemmy) {
		this.plugin = plugin;
		this.messageListener = this.handleMessage.bind(this);
		window.addEventListener("message", this.messageListener);
	}

	handleMessage(event: MessageEvent) {
		// Security Check: Origin
		if (event.origin !== YT_ORIGIN) return;

		// Security & Logic: Ensure the message is from OUR IFrame
		if (!this.playerIframe || event.source !== this.playerIframe.contentWindow) return;

		let data;
		try {
			data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
		} catch (e) {
			return;
		}

		if (!data || data.event === undefined) return;

		// Handle onReady
		if (data.event === "onReady") {
			console.log("Gemmy Debug: YouTube Player Ready");
			this.isPlayerReady = true;
			// If we entered focus mode and music was supposed to be playing, start it now.
			if (this.isPlayingMusic) {
				this.sendYouTubeCommand("playVideo", []);
			}
		}

		// Handle state changes
		if (data.event === "onStateChange") {
			const state = data.info; // 0: ended, 1: playing, 2: paused
			if (state === 0 && this.isFocusMode) { // Video ended
				console.log("Gemmy Music: Track ended, playing next random track.");
				this.playRandomMusic();
			}
		}

		// Handle infoDelivery for duration
		if (data.event === "infoDelivery" && data.info) {
			if (data.info.duration !== undefined && data.info.duration > 0) {
				const duration = data.info.duration;
				if (this.musicDuration === 0) {
					this.musicDuration = duration;
					console.log(`Gemmy Debug: Duration received: ${duration}s`);
					this.saveTrackDuration(this.currentMusicId, duration);
				}
			}
		}
	}

	async saveTrackDuration(id: string | null, duration: number) {
		if (!id) return;
		const tracks = this.plugin.dataManager.settings.focusTracks;
		const trackIndex = tracks.findIndex(t => t.id === id);
		if (trackIndex > -1 && !tracks[trackIndex].duration) {
			tracks[trackIndex].duration = duration;
			await this.plugin.dataManager.updateSettings({ focusTracks: tracks });
			console.log(`Gemmy: Saved duration for track ${id}: ${duration}s`);
		}
	}

	getVolume(): number {
		return this.focusVolumeSliderEl ? parseInt(this.focusVolumeSliderEl.value) : 50;
	}

	playFocusMusic(id: string) {
		if (!id) return;

		this.isPlayingMusic = true;
		this.musicDuration = 0;
		this.currentMusicId = id;

		if (this.playerIframe && this.isPlayerReady) {
			console.log(`Gemmy Music: Switching to track ${id}`);
			this.sendYouTubeCommand("loadVideoById", {
				videoId: id,
				startSeconds: 0,
				suggestedQuality: "small"
			});
			this.sendYouTubeCommand("unMute", []);
			this.sendYouTubeCommand("setVolume", [this.getVolume()]);
			this.sendYouTubeCommand("playVideo", []);
		} else {
			// Player not ready or iframe doesn't exist yet
			this.isPlayerReady = false;
			const src = `${YT_ORIGIN}/embed/${id}?autoplay=1&mute=0&enablejsapi=1&rel=0`;
			
			if (!this.playerIframe) {
				this.playerIframe = document.createElement("iframe");
				this.playerIframe.id = "gemmy-focus-music-player";
				this.playerIframe.className = "gemmy-hidden-iframe";
				this.playerIframe.allow = "autoplay; encrypted-media";
				document.body.appendChild(this.playerIframe);
			}
			this.playerIframe.src = src;
		}
	}

	initFocusControls(container: HTMLElement, buttonContainer: HTMLElement) {
		const focusControlsContainer = container.createDiv({
			cls: "gemmy-focus-controls-container hidden gemmy-focus-controls",
		});

		this.musicSelectEl = focusControlsContainer.createEl("select", {
			cls: "gemmy-music-selector",
		});
		this.musicSelectEl.onchange = (e: Event) => {
			const selectedValue = (e.target as HTMLSelectElement).value;
			if (selectedValue) {
				this.playFocusMusic(selectedValue);
				setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
				this.playPauseButtonEl.setAttribute("aria-label", "Pause Music");
			}
		};

		this.playPauseButtonEl = focusControlsContainer.createDiv({
			cls: "gemmy-play-pause-button clickable-icon",
		});
		setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
		this.playPauseButtonEl.setAttribute("aria-label", "Pause Music");
		this.playPauseButtonEl.onclick = () => this.toggleMusicPlayback();

		this.randomButtonEl = focusControlsContainer.createDiv({
			cls: "gemmy-random-button clickable-icon",
		});
		setIcon(this.randomButtonEl, "dice");
		this.randomButtonEl.setAttribute("aria-label", "Random Music");
		this.randomButtonEl.onclick = () => this.playRandomMusic();

		this.focusVolumeSliderEl = container.createEl("input", {
			type: "range",
			cls: "gemmy-volume-slider hidden",
		});
		this.focusVolumeSliderEl.min = "0";
		this.focusVolumeSliderEl.max = "100";
		this.focusVolumeSliderEl.value = "50";
		this.focusVolumeSliderEl.oninput = (e: Event) => {
			const volume = parseInt((e.target as HTMLInputElement).value);
			this.setMusicVolume(volume);
		};

		this.focusSettingsButtonEl = buttonContainer.createDiv({
			cls: "gemmy-focus-settings-button clickable-icon hidden",
		});
		setIcon(this.focusSettingsButtonEl, "settings");
		this.focusSettingsButtonEl.setAttribute("aria-label", "Focus Settings & Music");
		this.focusSettingsButtonEl.onclick = () => {
			new FocusSettingsModal(
				this.plugin.app,
				this.plugin.dataManager,
				(selectedValue) => {
					this.populateMusicList();
					if (this.musicSelectEl) this.musicSelectEl.value = selectedValue;
					this.playFocusMusic(selectedValue);
					setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
					this.playPauseButtonEl.setAttribute("aria-label", "Pause Music");
				},
			).open();
		};

		this.focusButtonEl = buttonContainer.createDiv({
			cls: `${CSS_CLASSES.FOCUS_BUTTON} clickable-icon`,
			text: UI_TEXT.ICONS.FOCUS_OFF,
		});
		this.focusButtonEl.setAttribute("aria-label", "Toggle Focus Mode ON");
		this.focusButtonEl.onclick = () => this.toggleFocusMode();

		this.populateMusicList();
		
		// Pre-warm the player
		this.initPlayer();
	}

	initPlayer() {
		if (this.playerIframe) return;
		
		const tracks = this.plugin.dataManager.settings.focusTracks || [];
		if (tracks.length === 0) return;
		
		const firstId = tracks[0].id;
		this.isPlayerReady = false;
		const src = `${YT_ORIGIN}/embed/${firstId}?autoplay=0&mute=1&enablejsapi=1&rel=0`;
		
		this.playerIframe = document.createElement("iframe");
		this.playerIframe.id = "gemmy-focus-music-player";
		this.playerIframe.className = "gemmy-hidden-iframe";
		this.playerIframe.allow = "autoplay; encrypted-media";
		document.body.appendChild(this.playerIframe);
		this.playerIframe.src = src;
	}

	playRandomMusic() {
		const tracks = this.plugin.dataManager.settings.focusTracks || [];
		if (tracks.length === 0) {
			new Notice("Gemmy: No music available to random!");
			return;
		}

		const randomIndex = Math.floor(Math.random() * tracks.length);
		const selectedId = tracks[randomIndex].id;

		if (this.musicSelectEl) {
			this.musicSelectEl.value = selectedId;
		}

		this.playFocusMusic(selectedId);
		setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
		this.playPauseButtonEl.setAttribute("aria-label", "Pause Music");

		new Notice("Gemmy: Playing random selection 🎲");
	}

	populateMusicList() {
		if (!this.musicSelectEl) return;
		this.musicSelectEl.empty();
		const tracks = this.plugin.dataManager.settings.focusTracks || [];
		if (tracks.length > 0) {
			tracks.forEach((track) => {
				this.musicSelectEl.createEl("option", {
					text: track.name,
					value: track.id,
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
		const buttonContainer = this.plugin.chatBubbleEl.querySelector(`.${CSS_CLASSES.GEMMY_BUTTON_CONTAINER}`);
		const focusControlsContainer = this.plugin.chatBubbleEl.querySelector(".gemmy-focus-controls-container");

		if (this.isFocusMode) {
			if (this.plugin.quoteManager && this.plugin.quoteManager.bubbleTimeout)
				this.plugin.quoteManager.clearBubbleTimeout();
			this.focusButtonEl.innerText = UI_TEXT.ICONS.FOCUS_ON;
			this.focusButtonEl.setAttribute("aria-label", "Toggle Focus Mode OFF");
			new Notice(NOTICES.FOCUS_MODE_ON);
			this.plugin.imageEl.style.opacity = "1";
			if (buttonContainer) buttonContainer.addClass("gemmy-focus-active");

			this.plugin.toggleModeButtonEl.addClass("hidden");
			this.plugin.favoriteButtonEl.addClass("hidden");
			this.plugin.menuButtonEl.addClass("hidden");
			this.plugin.previousButtonEl.addClass("hidden");
			this.plugin.nextButtonEl.addClass("hidden");

			this.focusVolumeSliderEl.removeClass("hidden");
			this.focusSettingsButtonEl.removeClass("hidden");
			if (focusControlsContainer)
				focusControlsContainer.removeClass("hidden");

			const defaultMins = this.plugin.dataManager.settings.focusDuration || 25;
			this.pomodoroTimeLeft = defaultMins * 60;
			this.isTimerRunning = false;
			this.renderFocusUI();

			this.populateMusicList();

			let targetId = this.currentMusicId;
			const tracks = this.plugin.dataManager.settings.focusTracks || [];
			let exists = false;
			if (targetId) exists = tracks.some((t) => t.id === targetId);
			if (!exists) {
				if (tracks.length > 0) targetId = tracks[0].id;
				else targetId = null;
			}

			if (targetId) {
				this.playFocusMusic(targetId);
			}
		} else {
			this.focusButtonEl.innerText = UI_TEXT.ICONS.FOCUS_OFF;
			this.focusButtonEl.setAttribute("aria-label", "Toggle Focus Mode ON");
			new Notice(NOTICES.FOCUS_MODE_OFF);
			this.stopPomodoro();
			this.stopFocusMusic();
			this.plugin.imageEl.style.opacity = "1";
			if (buttonContainer) buttonContainer.removeClass("gemmy-focus-active");
			this.focusVolumeSliderEl.addClass("hidden");
			this.focusSettingsButtonEl.addClass("hidden");
			if (focusControlsContainer) focusControlsContainer.addClass("hidden");
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
		const container = this.plugin.bubbleContentEl.createDiv("gemmy-focus-ui gemmy-focus-ui-container");
		if (!this.isTimerRunning) {
			const input = container.createEl("input", { type: "text", cls: "gemmy-timer-input" });
			const minutes = Math.floor(this.pomodoroTimeLeft / 60);
			const seconds = this.pomodoroTimeLeft % 60;
			input.value = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
			input.placeholder = "25:00";
			const parseTime = (val: string): number | null => {
				const v = val.trim();
				if (v.includes(":")) {
					const parts = v.split(":");
					if (parts.length === 2) {
						const m = parseInt(parts[0]);
						const s = parseInt(parts[1]);
						if (!isNaN(m) && !isNaN(s)) return m * 60 + s;
					}
				} else {
					const m = parseInt(v);
					if (!isNaN(m)) return m * 60;
				}
				return null;
			};
			input.onchange = () => {
				const seconds = parseTime(input.value);
				if (seconds !== null && seconds > 0) this.pomodoroTimeLeft = seconds;
			};
			const startBtn = container.createEl("button", { cls: "clickable-icon" });
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
			const minutes = Math.floor(this.pomodoroTimeLeft / 60);
			const seconds = this.pomodoroTimeLeft % 60;
			container.createSpan({ text: `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}` });
			const pauseResumeBtn = container.createEl("button", { cls: "clickable-icon" });
			if (this.isTimerPaused) {
				setIcon(pauseResumeBtn, "play");
				pauseResumeBtn.setAttribute("aria-label", "Resume Timer");
				pauseResumeBtn.onclick = () => this.resumePomodoro();
			} else {
				setIcon(pauseResumeBtn, "pause");
				pauseResumeBtn.setAttribute("aria-label", "Pause Timer");
				pauseResumeBtn.onclick = () => this.pausePomodoro();
			}
			const stopBtn = container.createEl("button", { cls: "clickable-icon" });
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
				this.plugin.bubbleContentEl.createDiv({ text: "Time's up! 🍅", cls: "gemmy-focus-finished" });
				new Notice("Gemmy: Session Finished!");
			} else {
				const container = this.plugin.bubbleContentEl.querySelector(".gemmy-focus-ui");
				if (container) {
					const span = container.querySelector("span");
					if (span) {
						const minutes = Math.floor(this.pomodoroTimeLeft / 60);
						const seconds = this.pomodoroTimeLeft % 60;
						span.innerText = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
					} else this.renderFocusUI();
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

	toggleMusicPlayback() {
		if (this.isPlayingMusic) {
			this.sendYouTubeCommand("pauseVideo", []);
			setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PLAY);
			this.playPauseButtonEl.setAttribute("aria-label", "Play Music");
			this.isPlayingMusic = false;
		} else {
			this.sendYouTubeCommand("playVideo", []);
			setIcon(this.playPauseButtonEl, UI_TEXT.ICONS.PAUSE);
			this.playPauseButtonEl.setAttribute("aria-label", "Pause Music");
			this.isPlayingMusic = true;
		}
	}

	setMusicVolume(volume: number) {
		this.sendYouTubeCommand("setVolume", [volume]);
	}

	sendYouTubeCommand(func: string, args: any) {
		if (this.playerIframe && this.playerIframe.contentWindow) {
			const command = JSON.stringify({
				event: "command",
				func: func,
				args: Array.isArray(args) ? args : [args]
			});
			this.playerIframe.contentWindow.postMessage(command, YT_ORIGIN);
		}
	}

	stopFocusMusic() {
		if (this.playerIframe && this.isPlayerReady) {
			this.sendYouTubeCommand("pauseVideo", []);
		}
		this.isPlayingMusic = false;
	}

	unload() {
		window.removeEventListener("message", this.messageListener);
		this.stopPomodoro();
		if (this.playerIframe) {
			this.playerIframe.remove();
			this.playerIframe = null;
		}
	}
}
