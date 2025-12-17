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
			text: "All settings have been moved to the Gemmy UI.",
		});
		containerEl.createEl("p", {
			text: "Click the Settings (gear) icon on Gemmy's bubble to configure.",
			cls: "setting-item-description",
		});
	}
}
