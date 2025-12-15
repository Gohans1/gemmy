import { Plugin, Notice } from "obsidian";
import { ViewAllQuotesModal, AddQuoteModal, ViewFavoritesModal, ImportModal } from "./modals";
import { COMMANDS, NOTICES } from "./constants";
import Gemmy from "./plugin"; // Import the main plugin class (if it is renamed to plugin.ts)

export function registerCommands(plugin: Gemmy) {
    plugin.addCommand({
        id: COMMANDS.VIEW_ALL_QUOTES.id,
        name: COMMANDS.VIEW_ALL_QUOTES.name,
        callback: () => {
            new ViewAllQuotesModal(plugin.app, plugin.dataManager).open();
        },
    });

    plugin.addCommand({
        id: COMMANDS.SHOW_GEMMY.id,
        name: COMMANDS.SHOW_GEMMY.name,
        callback: () => plugin.appear(),
    });

    plugin.addCommand({
        id: COMMANDS.EXPORT_ALL_QUOTES.id,
        name: COMMANDS.EXPORT_ALL_QUOTES.name,
        callback: () => plugin.exportQuotes(),
    });

    plugin.addCommand({
        id: COMMANDS.ADD_QUOTE.id,
        name: COMMANDS.ADD_QUOTE.name,
        callback: () => {
            new AddQuoteModal(plugin.app, async (newQuotes) => {
                const count = await plugin.dataManager.addQuotes(newQuotes);
                new Notice(NOTICES.NEW_QUOTES_SAVED(count));
            }).open();
        },
    });

    plugin.addCommand({
        id: COMMANDS.VIEW_FAVORITE_QUOTES.id,
        name: COMMANDS.VIEW_FAVORITE_QUOTES.name,
        callback: () => {
            new ViewFavoritesModal(plugin.app, plugin.dataManager).open();
        },
    });

    plugin.addCommand({
        id: COMMANDS.IMPORT_QUOTES.id,
        name: COMMANDS.IMPORT_QUOTES.name,
        callback: () => {
            new ImportModal(plugin.app, plugin.dataManager).open();
        },
    });
}
