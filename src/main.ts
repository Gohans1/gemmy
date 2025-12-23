import { Plugin, Notice, Menu, setIcon } from "obsidian";
import KAPILGUPTA_STATIC from "./kapilgupta.png";
import { GemmySettingTab } from "./settings";
import { DataManager } from "./DataManager";
import {
	CSS_CLASSES,
	UI_TEXT,
	NOTICES,
	COMMANDS,
} from "./constants";
import {
	ViewFavoritesModal,
	ViewAllQuotesModal,
	AddUserQuoteModal,
	ImportModal,
	ChangeFrequencyModal,
	ChangeAvatarModal,
} from "./modals";
import { FocusManager } from "./modes/FocusManager";
import { QuoteManager } from "./modes/QuoteManager";

export default class Gemmy extends Plugin {
	dataManager: DataManager;
	focusManager: FocusManager;
	quoteManager: QuoteManager; // New Manager

	gemmyEl: HTMLElement;
	imageEl: HTMLElement;
	chatBubbleEl: HTMLElement;
	bubbleContentEl: HTMLElement;

	// Buttons
	nextButtonEl: HTMLElement;
	previousButtonEl: HTMLElement;
	menuButtonEl: HTMLElement;
	favoriteButtonEl: HTMLElement;
	toggleModeButtonEl: HTMLElement;

	appeared = false;

	async onload() {
		this.dataManager = new DataManager(this);
		await this.dataManager.load();

		this.focusManager = new FocusManager(this);
		this.quoteManager = new QuoteManager(this); // Init QuoteManager

		const gemmyEl = (this.gemmyEl = createDiv(CSS_CLASSES.GEMMY_CONTAINER));
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

		// Init Focus Controls
		this.focusManager.initFocusControls(this.chatBubbleEl, buttonContainer);

		// 3. Normal Mode Buttons
		this.toggleModeButtonEl = buttonContainer.createDiv({
			cls: [CSS_CLASSES.TOGGLE_MODE_BUTTON, "clickable-icon"],
			text: UI_TEXT.ICONS.NORMAL_MODE,
		});
		this.toggleModeButtonEl.setAttribute("aria-label", UI_TEXT.LABELS.SWITCH_TO_FAV_MODE);

		this.favoriteButtonEl = buttonContainer.createDiv({
			cls: [CSS_CLASSES.FAVORITE_BUTTON, "clickable-icon"],
			text: UI_TEXT.ICONS.HEART_EMPTY,
		});
		this.favoriteButtonEl.setAttribute("aria-label", "Add to Favorites");

		this.menuButtonEl = buttonContainer.createDiv({
			cls: [CSS_CLASSES.MENU_BUTTON, "clickable-icon"],
		});
		setIcon(this.menuButtonEl, UI_TEXT.ICONS.MENU);
		this.menuButtonEl.setAttribute("aria-label", "Menu");

		this.previousButtonEl = buttonContainer.createDiv({
			cls: [CSS_CLASSES.NEXT_BUTTON, "clickable-icon"],
			text: UI_TEXT.BUTTONS.PREV,
		});
		this.previousButtonEl.setAttribute("aria-label", "Previous Quote");

		this.nextButtonEl = buttonContainer.createDiv({
			cls: [CSS_CLASSES.NEXT_BUTTON, "clickable-icon"],
			text: UI_TEXT.BUTTONS.NEXT,
		});
		this.nextButtonEl.setAttribute("aria-label", "Next Quote");

		// --- EVENT HANDLERS ---
		this.toggleModeButtonEl.onclick = () =>
			this.quoteManager.toggleFavMode();
		this.favoriteButtonEl.onclick = () =>
			this.quoteManager.toggleFavorite();
		this.menuButtonEl.onclick = (e) => this.showMainMenu(e);
		this.previousButtonEl.onclick = () => this.quoteManager.showPrevQuote();
		this.nextButtonEl.onclick = () => this.quoteManager.showNextQuote();

		// --- COMMANDS ---
		this.addCommand({
			id: COMMANDS.SHOW_GEMMY.id,
			name: COMMANDS.SHOW_GEMMY.name,
			callback: () => this.appear(),
		});
		this.addCommand({
			id: COMMANDS.TOGGLE_FOCUS_MODE.id,
			name: COMMANDS.TOGGLE_FOCUS_MODE.name,
			callback: () => this.focusManager.toggleFocusMode(),
		});

		this.addCommand({
			id: COMMANDS.TOGGLE_GEMMY.id,
			name: COMMANDS.TOGGLE_GEMMY.name,
			callback: () => this.toggle(),
		});

		this.addSettingTab(
			new GemmySettingTab(this.app, this, this.dataManager),
		);
		this.quoteManager.resetIdleInterval();
		this.makeDraggable(this.gemmyEl);
		this.app.workspace.onLayoutReady(() => {
			this.appear();
		});
	}

	showMainMenu(event: MouseEvent) {
		const menu = new Menu();
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
		menu.addItem((item) =>
			item
				.setTitle(UI_TEXT.MENU_ITEMS.VIEW_FAVORITES)
				.setIcon(UI_TEXT.ICONS.STAR)
				.onClick(() =>
					new ViewFavoritesModal(this.app, this.dataManager).open(),
				),
		);
		menu.addItem((item) =>
			item
				.setTitle(UI_TEXT.MENU_ITEMS.VIEW_ALL)
				.setIcon(UI_TEXT.ICONS.DOCUMENTS)
				.onClick(() =>
					new ViewAllQuotesModal(this.app, this.dataManager).open(),
				),
		);
		menu.addItem((item) =>
			item
				.setTitle(UI_TEXT.MENU_ITEMS.ADD_NEW)
				.setIcon(UI_TEXT.ICONS.PLUS_CIRCLE)
				.onClick(() =>
					new AddUserQuoteModal(this.app, async (newQuote) => {
						const success =
							await this.dataManager.addQuote(newQuote);
						if (success) new Notice(NOTICES.NEW_QUOTE_SAVED);
						else new Notice(NOTICES.QUOTE_EXISTS);
					}).open(),
				),
		);
		menu.addItem((item) =>
			item
				.setTitle(UI_TEXT.MENU_ITEMS.IMPORT)
				.setIcon(UI_TEXT.ICONS.UPLOAD)
				.onClick(() =>
					new ImportModal(this.app, this.dataManager).open(),
				),
		);
		menu.addItem((item) =>
			item
				.setTitle(UI_TEXT.MENU_ITEMS.EXPORT)
				.setIcon(UI_TEXT.ICONS.DOWNLOAD)
				.onClick(() => this.exportQuotes()),
		);
		menu.addSeparator();
		menu.addItem((item) =>
			item
				.setTitle(UI_TEXT.MENU_ITEMS.CHANGE_FREQUENCY)
				.setIcon(UI_TEXT.ICONS.CLOCK)
				.onClick(() =>
					new ChangeFrequencyModal(this.app, this.dataManager, () =>
						this.quoteManager.resetIdleInterval(),
					).open(),
				),
		);
		menu.addItem((item) =>
			item
				.setTitle(UI_TEXT.MENU_ITEMS.CHANGE_AVATAR)
				.setIcon(UI_TEXT.ICONS.IMAGE)
				.onClick(() =>
					new ChangeAvatarModal(this.app, this.dataManager, () => {
						if (this.appeared)
							this.imageEl.setAttribute(
								"src",
								this.getAvatarSource(),
							);
					}).open(),
				),
		);
		menu.addItem((item) =>
			item
				.setTitle(UI_TEXT.MENU_ITEMS.HIDE_GEMMY)
				.setIcon(UI_TEXT.ICONS.EYE_OFF)
				.onClick(() => this.disappear()),
		);
		menu.showAtMouseEvent(event);
	}

	exportQuotes() {
		const dataToExport = JSON.stringify(
			{ quotes: this.dataManager.allQuotes },
			null,
			2,
		);
		const blob = new Blob([dataToExport], { type: "application/json" });
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

	getAvatarSource(): string {
		const customPath = this.dataManager.settings.customAvatarPath;
		if (customPath && customPath.trim() !== "") {
			const path = customPath.trim();
			if (path.startsWith("http") || path.startsWith("app://"))
				return path;
			let normalizedPath = path.replace(/\\/g, "/");
			if (!normalizedPath.startsWith("/"))
				normalizedPath = "/" + normalizedPath;
			return "app://local" + normalizedPath;
		}
		return KAPILGUPTA_STATIC;
	}

	appear() {
		this.imageEl.setAttribute("src", this.getAvatarSource());
		this.appeared = true;

		// Apply saved position
		const pos = this.dataManager.settings.position;
		if (pos) {
			this.gemmyEl.style.top = pos.top + "px";
			this.gemmyEl.style.left = pos.left + "px";
		}

		document.body.appendChild(this.gemmyEl);
		this.gemmyEl.show();

		this.quoteManager.resetIdleInterval();

		if (this.focusManager && this.focusManager.isFocusMode) {
			this.chatBubbleEl.removeClass(CSS_CLASSES.HIDDEN);
			this.focusManager.renderFocusUI();
		} else {
			this.quoteManager.saySomething();
		}
	}

	toggle() {
		if (this.appeared) {
			this.disappear();
		} else {
			this.appear();
		}
	}

	disappear() {
		this.quoteManager.unload(); // Clear intervals/timeouts
		this.chatBubbleEl.addClass(CSS_CLASSES.HIDDEN);
		this.chatBubbleEl.removeClass("fade-out");
		this.gemmyEl.hide();
		this.appeared = false;
	}

	onunload() {
		if (this.focusManager) this.focusManager.unload();
		if (this.quoteManager) this.quoteManager.unload();
		this.gemmyEl.hide(); // Direct hide
		this.appeared = false;
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
			activeDocument.addEventListener("mouseup", closeDragElement);
			activeDocument.addEventListener("mousemove", elementDrag);
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

		const closeDragElement = async () => {
			activeDocument.removeEventListener("mouseup", closeDragElement);
			activeDocument.removeEventListener("mousemove", elementDrag);

			// Save position
			await this.dataManager.updateSettings({
				position: {
					top: elmnt.offsetTop,
					left: elmnt.offsetLeft,
				},
			});
		};

		this.imageEl.onmousedown = dragMouseDown;
	}
}
