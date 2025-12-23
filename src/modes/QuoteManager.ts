import { Notice } from "obsidian";
import type Gemmy from "../main";
import { UI_TEXT, NOTICES, CSS_CLASSES, CONSTANTS } from "../constants";

export class QuoteManager {
	plugin: Gemmy;

	isFavouriteMode = false;
	quoteHistory: string[] = [];
	historyIndex = 0;
	bubbleTimeout: number | undefined;
	idleIntervalId: number;

	constructor(plugin: Gemmy) {
		this.plugin = plugin;
	}

	toggleFavMode() {
		this.isFavouriteMode = !this.isFavouriteMode;
		if (this.isFavouriteMode) {
			if (this.plugin.dataManager.favoriteQuotes.length === 0) {
				new Notice(NOTICES.NO_FAVORITES_YET);
				this.isFavouriteMode = false;
				return;
			}
			this.plugin.toggleModeButtonEl.innerText = UI_TEXT.ICONS.FAVORITE_MODE;
			this.plugin.toggleModeButtonEl.setAttribute(
				"aria-label",
				UI_TEXT.LABELS.SWITCH_TO_NORMAL_MODE,
			);
			new Notice(NOTICES.SWITCHED_TO_FAV);
		} else {
			this.plugin.toggleModeButtonEl.innerText = UI_TEXT.ICONS.NORMAL_MODE;
			this.plugin.toggleModeButtonEl.setAttribute(
				"aria-label",
				UI_TEXT.LABELS.SWITCH_TO_FAV_MODE,
			);
			new Notice(NOTICES.SWITCHED_TO_NORMAL);
		}
		this.saySomething();
	}

	async toggleFavorite() {
		const currentQuote = this.plugin.bubbleContentEl.innerText;
		const added = await this.plugin.dataManager.toggleFavorite(currentQuote);
		if (added) {
			this.plugin.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_FILLED;
			this.plugin.favoriteButtonEl.setAttribute("aria-label", "Remove from Favorites");
			new Notice(NOTICES.ADDED_TO_FAVORITES);
		} else {
			this.plugin.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_EMPTY;
			this.plugin.favoriteButtonEl.setAttribute("aria-label", "Add to Favorites");
			new Notice(NOTICES.REMOVED_FROM_FAVORITES);
		}
	}

	async showPrevQuote() {
		if (this.historyIndex < this.quoteHistory.length - 1) {
			this.historyIndex++;
			const prevQuote = this.quoteHistory[this.historyIndex];
			await this.renderQuote(prevQuote);
			this.updateFavoriteButtonState(prevQuote);
		} else {
			new Notice(NOTICES.NO_MORE_HISTORY);
		}
	}

	async showNextQuote() {
		if (this.historyIndex > 0) {
			this.historyIndex--;
			const nextQuote = this.quoteHistory[this.historyIndex];
			await this.renderQuote(nextQuote);
			this.updateFavoriteButtonState(nextQuote);
		} else {
			this.saySomething();
		}
		this.resetIdleInterval();
	}

	resetIdleInterval() {
		if (this.idleIntervalId) window.clearInterval(this.idleIntervalId);
		this.idleIntervalId = window.setInterval(() => {
			if (this.plugin.appeared) this.saySomething();
		}, this.plugin.dataManager.settings.idleTalkFrequency * 1000);
		this.plugin.registerInterval(this.idleIntervalId);
	}

	async saySomething() {
		// Use optional chaining or check existence for focusManager
		if (this.plugin.focusManager && this.plugin.focusManager.isFocusMode) return;
		if (!this.plugin.appeared) return;
		this.clearBubbleTimeout();

		let sourceQuotes = this.plugin.dataManager.allQuotes;
		if (this.isFavouriteMode) {
			if (this.plugin.dataManager.favoriteQuotes.length === 0) {
				this.isFavouriteMode = false;
				this.plugin.toggleModeButtonEl.innerText = UI_TEXT.ICONS.NORMAL_MODE;
				new Notice(NOTICES.NO_FAVORITES_YET);
			} else {
				sourceQuotes = this.plugin.dataManager.favoriteQuotes;
			}
		}

		if (sourceQuotes.length === 0) return;

		this.historyIndex = 0;
		const randomThing =
			sourceQuotes[Math.floor(Math.random() * sourceQuotes.length)];
		this.quoteHistory.unshift(randomThing);
		if (this.quoteHistory.length > 1000) this.quoteHistory.pop();

		await this.renderQuote(randomThing);
		this.updateFavoriteButtonState(randomThing);

		// Removed auto-hide logic to keep the quote visible until the next one
		// this.bubbleTimeout = window.setTimeout(() => { ... }, CONSTANTS.BUBBLE_DURATION);
	}

	clearBubbleTimeout() {
		if (this.bubbleTimeout) {
			window.clearTimeout(this.bubbleTimeout);
			this.bubbleTimeout = undefined;
		}
	}

	async renderQuote(quote: string) {
		// Ensure bubble is visible when rendering a quote (e.g. navigation)
		this.clearBubbleTimeout();
		this.plugin.chatBubbleEl.removeClass(CSS_CLASSES.HIDDEN);
		this.plugin.chatBubbleEl.removeClass("fade-out");
		this.plugin.imageEl.setAttribute("src", this.plugin.getAvatarSource());

		this.plugin.bubbleContentEl.empty();
		this.plugin.bubbleContentEl.innerText = quote;

		// Trigger bounce animation every time a quote is rendered
		this.plugin.imageEl.classList.remove("gemmy-bounce");
		void this.plugin.imageEl.offsetWidth; // Force reflow
		this.plugin.imageEl.classList.add("gemmy-bounce");
	}

	updateFavoriteButtonState(quote: string) {
		if (this.plugin.dataManager.isFavorite(quote)) {
			this.plugin.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_FILLED;
			this.plugin.favoriteButtonEl.setAttribute("aria-label", "Remove from Favorites");
		} else {
			this.plugin.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_EMPTY;
			this.plugin.favoriteButtonEl.setAttribute("aria-label", "Add to Favorites");
		}
	}

    unload() {
        if (this.idleIntervalId) clearInterval(this.idleIntervalId);
        this.clearBubbleTimeout();
    }
}
