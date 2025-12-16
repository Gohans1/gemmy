import {
	App,
	PluginSettingTab,
	Setting,
	Notice,
	setIcon,
	ButtonComponent,
} from "obsidian";
import type Gemmy from "./main";
import { DataManager } from "./DataManager";
import { UI_TEXT } from "./constants";

export class GemmySettingTab extends PluginSettingTab {
	plugin: Gemmy;
	dataManager: DataManager;

	constructor(app: App, plugin: Gemmy, dataManager: DataManager) {
		super(app, plugin);
		this.plugin = plugin;
		this.dataManager = dataManager;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Gemmy Settings" });

		// --- IDLE SETTINGS ---
		new Setting(containerEl)
			.setName(UI_TEXT.LABELS.IDLE_FREQUENCY_NAME)
			.setDesc(UI_TEXT.LABELS.IDLE_FREQUENCY_DESC)
			.addSlider((slider) =>
				slider
					.setLimits(5, 300, 5)
					.setValue(this.dataManager.settings.idleTalkFrequency)
					.setDynamicTooltip()
					.onChange(async (value) => {
						await this.dataManager.updateSettings({
							idleTalkFrequency: value,
						});
						this.plugin.resetIdleInterval();
					}),
			);

		// --- FOCUS MODE SETTINGS ---
		containerEl.createEl("h2", { text: "Focus Mode Settings" });

		new Setting(containerEl)
			.setName("Default Focus Duration (minutes)")
			.setDesc("How long should a focus session last by default?")
			.addText((text) =>
				text
					.setPlaceholder("25")
					.setValue(
						this.dataManager.settings.focusDuration?.toString() ||
							"25",
					)
					.onChange(async (value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num > 0) {
							await this.dataManager.updateSettings({
								focusDuration: num,
							});
						}
					}),
			);

		// --- PLAYLIST MANAGER ---
		containerEl.createEl("h3", { text: "Focus Playlist" });
		const playlistContainer = containerEl.createDiv(
			"gemmy-playlist-container",
		);

		// Render existing playlist
		this.renderPlaylist(playlistContainer);

		// Add New Track Area
		containerEl.createEl("h4", { text: "Add New Track" });
		const addTrackContainer = containerEl.createDiv(
			"gemmy-add-track-container",
		);
		addTrackContainer.style.display = "flex";
		addTrackContainer.style.gap = "10px";
		addTrackContainer.style.marginBottom = "20px";
		addTrackContainer.style.alignItems = "flex-end";

		let newName = "";
		let newUrl = "";

		const nameInputContainer = addTrackContainer.createDiv();
		nameInputContainer.style.flex = "1";
		nameInputContainer.createEl("div", {
			text: "Track Name",
			cls: "setting-item-name",
		});
		const nameInput = nameInputContainer.createEl("input", {
			type: "text",
		});
		nameInput.placeholder = "e.g. Lofi Chill";
		nameInput.style.width = "100%";
		nameInput.oninput = (e) =>
			(newName = (e.target as HTMLInputElement).value);

		const urlInputContainer = addTrackContainer.createDiv();
		urlInputContainer.style.flex = "2";
		urlInputContainer.createEl("div", {
			text: "YouTube URL",
			cls: "setting-item-name",
		});
		const urlInput = urlInputContainer.createEl("input", { type: "text" });
		urlInput.placeholder = "https://www.youtube.com/watch?v=...";
		urlInput.style.width = "100%";
		urlInput.oninput = (e) =>
			(newUrl = (e.target as HTMLInputElement).value);

		const addButtonDiv = addTrackContainer.createDiv();
		const addButton = new ButtonComponent(addButtonDiv)
			.setButtonText("Add Track")
			.setCta()
			.onClick(async () => {
				if (!newName || !newUrl) {
					new Notice("Please enter both name and URL.");
					return;
				}
				const videoId = this.extractYouTubeId(newUrl);
				if (!videoId) {
					new Notice("Invalid YouTube URL.");
					return;
				}

				const currentPlaylist =
					this.dataManager.settings.playlist || [];
				const newTrack = { id: videoId, name: newName, url: newUrl };
				await this.dataManager.updateSettings({
					playlist: [...currentPlaylist, newTrack],
				});

				new Notice(`Added "${newName}" to playlist!`);
				// Clear inputs
				nameInput.value = "";
				urlInput.value = "";
				newName = "";
				newUrl = "";
				// Re-render
				this.renderPlaylist(playlistContainer);
			});
	}

	renderPlaylist(container: HTMLElement) {
		container.empty();
		const playlist = this.dataManager.settings.playlist || [];

		if (playlist.length === 0) {
			container.createEl("p", {
				text: "No tracks in playlist. Add one below!",
				cls: "setting-item-description",
			});
			return;
		}

		playlist.forEach((track, index) => {
			const row = container.createDiv("gemmy-playlist-item");
			row.style.display = "flex";
			row.style.alignItems = "center";
			row.style.padding = "10px";
			row.style.backgroundColor = "var(--background-secondary)";
			row.style.marginBottom = "5px";
			row.style.borderRadius = "4px";
			row.style.gap = "10px";

			// Index
			row.createEl("span", {
				text: `${index + 1}.`,
				cls: "gemmy-playlist-index",
			});

			// Info
			const info = row.createDiv();
			info.style.flex = "1";
			info.createEl("div", {
				text: track.name,
				cls: "gemmy-track-name",
				attr: { style: "font-weight: bold;" },
			});
			info.createEl("div", {
				text: track.url,
				cls: "setting-item-description",
				attr: { style: "font-size: 0.8em;" },
			});

			// Controls
			const controls = row.createDiv();
			controls.style.display = "flex";
			controls.style.gap = "5px";

			// Move Up
			if (index > 0) {
				const upBtn = controls.createEl("button", {
					cls: "clickable-icon",
				});
				setIcon(upBtn, "arrow-up");
				upBtn.onclick = async () => {
					const newPlaylist = [...playlist];
					[newPlaylist[index - 1], newPlaylist[index]] = [
						newPlaylist[index],
						newPlaylist[index - 1],
					];
					await this.dataManager.updateSettings({
						playlist: newPlaylist,
					});
					this.renderPlaylist(container);
				};
			}

			// Move Down
			if (index < playlist.length - 1) {
				const downBtn = controls.createEl("button", {
					cls: "clickable-icon",
				});
				setIcon(downBtn, "arrow-down");
				downBtn.onclick = async () => {
					const newPlaylist = [...playlist];
					[newPlaylist[index + 1], newPlaylist[index]] = [
						newPlaylist[index],
						newPlaylist[index + 1],
					];
					await this.dataManager.updateSettings({
						playlist: newPlaylist,
					});
					this.renderPlaylist(container);
				};
			}

			// Delete
			const deleteBtn = controls.createEl("button", {
				cls: "clickable-icon mod-warning",
			});
			setIcon(deleteBtn, "trash");
			deleteBtn.onclick = async () => {
				const newPlaylist = playlist.filter((_, i) => i !== index);
				await this.dataManager.updateSettings({
					playlist: newPlaylist,
				});
				this.renderPlaylist(container);
			};
		});
	}

	extractYouTubeId(url: string): string | null {
		const regExp =
			/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
		const match = url.match(regExp);
		return match && match[2].length === 11 ? match[2] : null;
	}
}
