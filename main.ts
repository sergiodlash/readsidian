import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { goodReadsParser } from './goodreads-rss-parser'

// Remember to rename these classes and interfaces!

interface ReadsidianSettings {
	goodReadsUserID: string;
	bookshelf: string;
	readsidianDirectory : string;
}

const DEFAULT_SETTINGS: ReadsidianSettings = {
	goodReadsUserID: '',
	bookshelf: 'read',
	readsidianDirectory: ''
}	

export default class Readsidian extends Plugin {
	settings: ReadsidianSettings;

	async onload() {

		await this.loadSettings();

		const ribbonIconEl = this.addRibbonIcon('book', 'Readsidian', (evt: MouseEvent) => {
			this.fetchBooks()
		});	
		ribbonIconEl.addClass('readsidian-ribbon-class');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

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

		new Notice('Import from user ID: ' + this.settings.goodReadsUserID);
		new Notice('Import from GoodReads shelf: ' + this.settings.bookshelf);

		const url = 'https://www.goodreads.com/review/list_rss/'+ this.settings.goodReadsUserID + '?shelf='+this.settings.bookshelf;

		const feed = await goodReadsParser.parseURL(url);

		feed.items.forEach((item : any)=> {
			console.log(item.book_id);

			const properties = {
				type : "goodReadsBook", 
				bookID : item.book_id,
				author : "\"[[" + item.author_name +"]]\""}
			const title = item.title.replace(/[:\/\\]/g, ' '); // Replace illegal chars with blank
			
		  this.createCustomNote(title, properties, "Testing")

		});

	}

	async createCustomNote(title : string , attributes : object, content : string) {
			const fileName = `${title}.md`; // The note's title
			const folderPath = this.settings.readsidianDirectory; // Specify a folder, or use "" for root
			const filePath = `${folderPath}/${fileName}`;
		
			// Construct the note content with attributes in YAML front matter
			const frontMatter = 
`---
${Object.entries(attributes)
.map(([key, value]) => `${key}: ${value}`)
.join("\n")}
---

${content}`;
		
			// Create the note
			try {
				await this.app.vault.create(filePath, frontMatter);
				new Notice(`Note "${title}" created successfully!`);
			} catch (error) {
				console.error(`Error creating note "${title}`, error);
				new Notice("Failed to create the note. Check the console for details.");
			}
		}

}



class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
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
				.setDesc('In which directory in your vault should the book notes be created?')
				.addText(text => text
					.setPlaceholder('myBooks')
				.setValue(this.plugin.settings.readsidianDirectory)
				.onChange(async (value) => {
					this.plugin.settings.readsidianDirectory = value;
					await this.plugin.saveSettings();
			}));

				
}
}
