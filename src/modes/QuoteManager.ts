import { Notice } from "obsidian";
import type Gemmy from "../main";
import { UI_TEXT, NOTICES, CSS_CLASSES, CONSTANTS } from "../constants";

export class QuoteManager {
	plugin: Gemmy;

	isFavouriteMode = false;
	quoteHistory: string[] = [];
	historyIndex = 0;
	bubbleTimeout: number;
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
				"data-tooltip",
				UI_TEXT.LABELS.SWITCH_TO_NORMAL_MODE,
			);
			new Notice(NOTICES.SWITCHED_TO_FAV);
		} else {
			this.plugin.toggleModeButtonEl.innerText = UI_TEXT.ICONS.NORMAL_MODE;
			this.plugin.toggleModeButtonEl.setAttribute(
				"data-tooltip",
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
			this.plugin.favoriteButtonEl.setAttribute(
				"data-tooltip",
				"Remove from Favorites",
			);
			new Notice(NOTICES.ADDED_TO_FAVORITES);
		} else {
			this.plugin.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_EMPTY;
			this.plugin.favoriteButtonEl.setAttribute(
				"data-tooltip",
				"Add to Favorites",
			);
			new Notice(NOTICES.REMOVED_FROM_FAVORITES);
		}
	}

	showPrevQuote() {
		if (this.historyIndex < this.quoteHistory.length - 1) {
			this.historyIndex++;
			const prevQuote = this.quoteHistory[this.historyIndex];
			this.plugin.bubbleContentEl.innerText = prevQuote;
			this.updateFavoriteButtonState(prevQuote);
		} else {
			new Notice(NOTICES.NO_MORE_HISTORY);
		}
	}

	showNextQuote() {
		if (this.historyIndex > 0) {
			this.historyIndex--;
			const nextQuote = this.quoteHistory[this.historyIndex];
			this.plugin.bubbleContentEl.innerText = nextQuote;
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

	saySomething() {
		// Use optional chaining or check existence for focusManager
		if (this.plugin.focusManager && this.plugin.focusManager.isFocusMode) return;
		if (!this.plugin.appeared) return;
		if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);

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

		this.plugin.bubbleContentEl.empty();
		this.plugin.bubbleContentEl.innerText = randomThing;
		this.updateFavoriteButtonState(randomThing);

		this.plugin.chatBubbleEl.removeClass(CSS_CLASSES.HIDDEN);
		this.plugin.chatBubbleEl.removeClass("fade-out");
		this.plugin.imageEl.setAttribute("src", this.plugin.getAvatarSource());

		this.bubbleTimeout = window.setTimeout(() => {
			this.plugin.chatBubbleEl.addClass("fade-out");
			window.setTimeout(() => {
				if (this.plugin.chatBubbleEl.hasClass("fade-out")) {
					this.plugin.chatBubbleEl.addClass(CSS_CLASSES.HIDDEN);
				}
			}, 300);
		}, CONSTANTS.BUBBLE_DURATION);
	}


	updateFavoriteButtonState(quote: string) {
		if (this.plugin.dataManager.isFavorite(quote)) {
			this.plugin.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_FILLED;
			this.plugin.favoriteButtonEl.setAttribute(
				"data-tooltip",
				"Remove from Favorites",
			);
		} else {
			this.plugin.favoriteButtonEl.innerText = UI_TEXT.ICONS.HEART_EMPTY;
			this.plugin.favoriteButtonEl.setAttribute(
				"data-tooltip",
				"Add to Favorites",
			);
		}
	}

    unload() {
        if (this.idleIntervalId) clearInterval(this.idleIntervalId);
        if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
    }
}
