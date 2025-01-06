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
			id: 'readsidian-try-template',
			name: 'Test reaadsidian template',
			callback: () => {
				this.createNoteFromTemplate();
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

		//new Notice('Import from user ID: ' + this.settings.goodReadsUserID);
		new Notice('Import from GoodReads shelf: ' + this.settings.bookshelf);

		const url = 'https://www.goodreads.com/review/list_rss/'+ this.settings.goodReadsUserID + '?shelf='+this.settings.bookshelf;

		const feed = await goodReadsParser.parseURL(url);

		feed.items.forEach((item : any)=> {
			console.log(item.book_id);

			const properties = {
				type : "goodReadsBook", 
				bookID : item.book_id,
				author : "\"[[" + item.author_name +"]]\""}
			const title = item.title.replace(/[:\/\\]/g, ''); // Replace illegal chars with blank
			
		  this.createCustomNote(title, properties, "Testing")

		});

	}


  async createNoteFromTemplate() {
    const templatePath = this.settings.templateNote; // Adjust the path
    const outputPath = `./Note_testing.md`;

    const templateFile = this.app.vault.getAbstractFileByPath(templatePath) as TFile;
    if (!templateFile) {
      new Notice("Template file not found");
      return;
    }

    const templateContent = await this.app.vault.read(templateFile);

    // Data to inject
    const context = { date: new Date().toLocaleDateString(), title: "Dynamic Note" };

    const renderedContent = nunjucks.renderString(templateContent, context);

		new Notice("rendered content. Out : " + outputPath);

    await this.app.vault.create(outputPath, renderedContent);
    new Notice(`Note created at ${outputPath}`);
  }

	async createCustomNote(title : string , attributes : any, content : string) {
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
			const existingFiles = await this.app.vault.getMarkdownFiles();
			let noteExists = false;

			for (const file of existingFiles) {
				const content = await this.app.vault.read(file);
				if (content.includes(`bookID: ${(attributes as any).bookID}`)) {
					noteExists = true;
					break;
				}
			}

			if (!noteExists) {
				try {
					await this.app.vault.create(filePath, frontMatter);
					new Notice(`Note "${title}" created successfully!`);
				} catch (error) {
					console.error(`Error creating note "${title}`, error);
					new Notice("Failed to create the note. Check the console for details.");
				}
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
					.setPlaceholder('TemplatesDirectory/Template Note.md')
					.setValue(this.plugin.settings.templateNote)
					.onChange(async (value) => {
						this.plugin.settings.templateNote = value;
						await this.plugin.saveSettings();
					}));

				
}
}
