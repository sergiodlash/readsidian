import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { goodReadsParser } from './goodreads-rss-parser';
import nunjucks from 'nunjucks';

// Remember to rename these classes and interfaces!

interface ReadsidianSettings {
	goodReadsUserID: string;
	bookshelf: string;
	readsidianDirectory : string;
	templateNote : string;
}

const DEFAULT_SETTINGS: ReadsidianSettings = {
	goodReadsUserID: '',
	bookshelf: 'read',
	readsidianDirectory: '',
	templateNote: ''
}	

export default class Readsidian extends Plugin {
	settings: ReadsidianSettings;

	async onload() {

		await this.loadSettings();

		const ribbonIconEl = this.addRibbonIcon('book', 'Readsidian', (evt: MouseEvent) => {
			this.fetchBooks()
		});	
		ribbonIconEl.addClass('readsidian-ribbon-class');


		this.addCommand({
			id: 'import-to-template',
			name: 'Import Goodreads books using template',
			callback: () => {
				this.fetchBooks();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ReadsidianSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		//this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		//	console.log('click', evt);
		//});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		//this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async fetchBooks(){

		new Notice('Import from GoodReads shelf: ' + this.settings.bookshelf);

		const url = 'https://www.goodreads.com/review/list_rss/'+ this.settings.goodReadsUserID + '?shelf='+this.settings.bookshelf;

		const feed = await goodReadsParser.parseURL(url);

		const localBooks = await this.listBookIDs();

		const templateContent = await this.getTemplateContent()

		const folderPath = this.settings.readsidianDirectory;

		feed.items.forEach(async (item : any) => {
			console.log(item.book_id);
			if (!localBooks.includes(item.book_id)) {
				console.log(item.book_id);

				//Crete the note
				const title = item.title.replace(/[:\/\\]/g, ''); // Replace illegal chars with blank
				const fileName = `${title}.md`; // The note's title
				const filePath = `${folderPath}/${fileName}`;

				// Do not overwrite existing notes
        if (this.app.vault.getAbstractFileByPath(filePath)) {
            new Notice(`Note with title "${title}" already exists at ${filePath}`);
            return;
        }
				
				if (templateContent) {
					const renderedContent = nunjucks.renderString(templateContent, item);
					await this.app.vault.create(filePath, renderedContent);
					new Notice(`Note created at ${filePath}`);
				} else {
					new Notice("Template content is undefined");
				}

			}

		});

	}


	// Helper Functions

	async listBookIDs() {
		const folderPath = this.settings.readsidianDirectory;
		const files = await this.app.vault.getMarkdownFiles();
		const bookIDs: string[] = [];

		for (const file of files) {
			if (file.path.startsWith(folderPath)) {
				const content = await this.app.vault.read(file);
				const match = content.match(/bookID:\s*(\d+)/);
				if (match) {
					bookIDs.push(match[1]);
				}
			}
		}

		return bookIDs;
	}

	async getTemplateContent() {
		const templatePath = this.settings.templateNote;

    const templateFile = this.app.vault.getAbstractFileByPath(templatePath) as TFile;
    if (!templateFile) {
      new Notice("Template file not found");
      return;
    }

    const templateContent = await this.app.vault.read(templateFile);

		return templateContent;
	}

}


class ReadsidianSettingTab extends PluginSettingTab {
	plugin: Readsidian;

	constructor(app: App, plugin: Readsidian) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('GoodReads User ID')
			.setDesc('Type your GoodReads user ID.')
			.addText(text => text
			.setPlaceholder('12356-your-user')
			.setValue(this.plugin.settings.goodReadsUserID)
			.onChange(async (value) => {
				this.plugin.settings.goodReadsUserID = value;
				await this.plugin.saveSettings();
			}));

			new Setting(containerEl)
				.setName('Bookshelf')
				.setDesc('GoodReads shelf to get the books from')
				.addText(text => text
					.setPlaceholder('read')
				.setValue(this.plugin.settings.bookshelf)
				.onChange(async (value) => {
					this.plugin.settings.bookshelf = value;
					await this.plugin.saveSettings();
				}));

			new Setting(containerEl)
				.setName('Notes directory')
				.setDesc('In which directory in your vault should the book notes be?')
				.addText(text => text
					.setPlaceholder('myBooks')
				.setValue(this.plugin.settings.readsidianDirectory)
				.onChange(async (value) => {
					this.plugin.settings.readsidianDirectory = value;
					await this.plugin.saveSettings();
			}));

			
			new Setting(containerEl)
				.setName('New book template')
				.setDesc('Set the template for the new book notes')
				.addText(text => text
					.setPlaceholder('Templates/Readsidian Template.md')
					.setValue(this.plugin.settings.templateNote)
					.onChange(async (value) => {
						this.plugin.settings.templateNote = value;
						await this.plugin.saveSettings();
					}));
		
}
}
