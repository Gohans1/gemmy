import { App, PluginSettingTab, Setting } from "obsidian";
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
		containerEl.createEl("p", {
			text: "Focus Mode settings (Playlist & Timer) are now located in the Gemmy Focus Menu.",
		});

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
	}
}
