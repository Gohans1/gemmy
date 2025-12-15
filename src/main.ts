import { App, Plugin, Notice, Menu, setIcon } from "obsidian";
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
	isFavouriteMode: boolean = false; // Default to Normal Mode
	gemmyEl: HTMLElement;
	imageEl: HTMLElement;
	chatBubbleEl: HTMLElement;
	bubbleContentEl: HTMLElement;
	nextButtonEl: HTMLElement;
	previousButtonEl: HTMLElement;
	menuButtonEl: HTMLElement;
	exportButtonEl: HTMLElement;
	favoriteButtonEl: HTMLElement;
	toggleModeButtonEl: HTMLElement; // Button to switch modes
	viewAllButtonEl: HTMLElement;
	bubbleTimeout: number;
	idleIntervalId: number;
	appeared: boolean = false;
	quoteHistory: string[] = [];
	historyIndex: number = 0;

	async onload() {
		this.dataManager = new DataManager(this);
		await this.dataManager.load();

		let gemmyEl = (this.gemmyEl = createDiv(CSS_CLASSES.GEMMY_CONTAINER));
		this.imageEl = gemmyEl.createEl("img", {});
		this.chatBubbleEl = gemmyEl.createDiv({
			cls: [CSS_CLASSES.GEMMY_BUBBLE, CSS_CLASSES.HIDDEN],
		});
		this.bubbleContentEl = this.chatBubbleEl.createDiv({
			cls: CSS_CLASSES.GEMMY_BUBBLE_CONTENT,
		});
		const buttonContainer = this.chatBubbleEl.createDiv({
			cls: CSS_CLASSES.GEMMY_BUTTON_CONTAINER,
		});

		this.toggleModeButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.TOGGLE_MODE_BUTTON,
			text: UI_TEXT.ICONS.NORMAL_MODE,
		});
		this.toggleModeButtonEl.setAttribute(
			"aria-label",
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
		this.menuButtonEl.setAttribute("aria-label", UI_TEXT.LABELS.MENU);

		this.previousButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.NEXT_BUTTON,
			text: UI_TEXT.BUTTONS.PREV,
		});

		this.nextButtonEl = buttonContainer.createEl("button", {
			cls: CSS_CLASSES.NEXT_BUTTON,
			text: UI_TEXT.BUTTONS.NEXT,
		});

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
					"aria-label",
					UI_TEXT.LABELS.SWITCH_TO_NORMAL_MODE,
				);
				new Notice(NOTICES.SWITCHED_TO_FAV);
			} else {
				this.toggleModeButtonEl.innerText = UI_TEXT.ICONS.NORMAL_MODE;
				this.toggleModeButtonEl.setAttribute(
					"aria-label",
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
			return customPath.trim();
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

	saySomething() {
		if (!this.appeared) return;
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
		let randomThing =
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
