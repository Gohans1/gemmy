import { Plugin } from "obsidian";
import { GemmyData, GemmySettings } from "./types";
import { DEFAULT_SETTINGS } from "./constants";

export class DataManager {
	private plugin: Plugin;
	settings: GemmySettings;
	allQuotes: string[] = [];
	favoriteQuotes: string[] = [];

	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	async load() {
		const data: GemmyData = await this.plugin.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data?.settings);
		this.allQuotes = data?.quotes || [];
		this.favoriteQuotes = data?.favoriteQuotes || [];
	}

	async save() {
		await this.plugin.saveData({
			settings: this.settings,
			quotes: this.allQuotes,
			favoriteQuotes: this.favoriteQuotes,
		});
	}

	async addQuote(quote: string): Promise<boolean> {
		if (!this.allQuotes.includes(quote)) {
			this.allQuotes.push(quote);
			await this.save();
			return true;
		}
		return false;
	}

	async addQuotes(quotes: string[]): Promise<number> {
		const uniqueNewQuotes = quotes.filter(
			(q) => !this.allQuotes.includes(q),
		);
		if (uniqueNewQuotes.length > 0) {
			this.allQuotes.push(...uniqueNewQuotes);
			await this.save();
		}
		return uniqueNewQuotes.length;
	}

	async removeQuote(quote: string): Promise<boolean> {
		const index = this.allQuotes.indexOf(quote);
		if (index > -1) {
			this.allQuotes.splice(index, 1);
			await this.save();
			return true;
		}
		return false;
	}

	async toggleFavorite(quote: string): Promise<boolean> {
		// returns true if added, false if removed
		if (this.favoriteQuotes.includes(quote)) {
			this.favoriteQuotes = this.favoriteQuotes.filter((q) => q !== quote);
			await this.save();
			return false;
		} else {
			this.favoriteQuotes.push(quote);
			await this.save();
			return true;
		}
	}

	async removeFromFavorites(quote: string): Promise<boolean> {
		const index = this.favoriteQuotes.indexOf(quote);
		if (index > -1) {
			this.favoriteQuotes.splice(index, 1);
			await this.save();
			return true;
		}
		return false;
	}

	isFavorite(quote: string): boolean {
		return this.favoriteQuotes.includes(quote);
	}

	async updateSettings(newSettings: Partial<GemmySettings>) {
		Object.assign(this.settings, newSettings);
		await this.save();
	}
}
