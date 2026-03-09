import { App, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian'
import { goodReadsParser } from './goodreads-rss-parser'

interface ReadsidianSettings {
	goodReadsUserID: string
	bookshelf: string
	readsidianDirectory: string
	templateNote: string
}

const DEFAULT_SETTINGS: ReadsidianSettings = {
	goodReadsUserID: '',
	bookshelf: 'read',
	readsidianDirectory: '',
	templateNote: ''
}

export default class Readsidian extends Plugin {
	settings: ReadsidianSettings

	async onload () {
		await this.loadSettings()

		const ribbonIconEl = this.addRibbonIcon(
			'book',
			'Readsidian',
			(evt: MouseEvent) => {
				this.fetchBooks()
			}
		)
		ribbonIconEl.addClass('readsidian-ribbon-class')

		this.addCommand({
			id: 'import-to-template',
			name: 'Import Goodreads books using template',
			callback: () => {
				this.fetchBooks()
			}
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ReadsidianSettingTab(this.app, this))

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		//this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		//	console.log('click', evt);
		//});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		//this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload () {}

	async loadSettings () {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		)
	}

	async saveSettings () {
		await this.saveData(this.settings)
	}

	async fetchBooks () {
		new Notice('Import from GoodReads shelf: ' + this.settings.bookshelf)

		try {
			const url =
				'https://www.goodreads.com/review/list_rss/' +
				this.settings.goodReadsUserID +
				'?shelf=' +
				this.settings.bookshelf

			const feed = await goodReadsParser.parseURL(url)

			const localBooks = await this.listBookIDs()

			const templateContent = await this.getTemplateContent()

			const folderPath = this.settings.readsidianDirectory.replace(
				/\/+$/,
				''
			)

			for (const item of feed.items) {
				if (!localBooks.includes(item.book_id)) {
					// Create the note
					const title = item.title.replace(/[:\/\\]/g, '') // Replace illegal chars with blank
					const fileName = `${title}.md`
					const filePath = `${folderPath}/${fileName}`

					// Do not overwrite existing notes
					if (this.app.vault.getAbstractFileByPath(filePath)) {
						new Notice(
							`Note with title "${title}" already exists at ${filePath}`
						)
						continue
					}

					if (templateContent) {
						const templateData: Record<string, unknown> = {
							...item,
							book_description: this.htmlToMarkdown(
								item.book_description
							).replace(/\n/g, '\n> '),
							user_review: this.htmlToMarkdown(item.user_review)
						}
						const renderedContent = templateContent.replace(
							/\{\{\s*(\w+)\s*\}\}/g,
							(_, key) => String(templateData[key] ?? '')
						)
						await this.app.vault.create(filePath, renderedContent)
						new Notice(`Note created at ${filePath}`)
					} else {
						new Notice('Template content is undefined')
					}
				}
			}
		} catch (error) {
			console.error('Readsidian: fetchBooks failed', error)
			new Notice(
				`Readsidian error fetching books: ${
					error instanceof Error ? error.message : String(error)
				}`
			)
		}
	}

	// Small utility function to correct issues from the html data fields in obsidian markdown syntax
	htmlToMarkdown (html: string): string {
		if (!html) return ''
		return html
			.replace(/<i>/gi, '*') // opening <i> to italic
			.replace(/<\/i>/gi, '*') // closing </i> to italic
			.replace(/<br\s*\/?>/gi, ' \n ') // <br> tags to line break
			.replace(/\n{3,}/g, '\n\n ') // collapse 3+ newlines to 2
			.trim()
	}

	// Helper Functions

	async listBookIDs () {
		const folderPath = this.settings.readsidianDirectory
		const files = await this.app.vault.getMarkdownFiles()
		const bookIDs: string[] = []

		for (const file of files) {
			if (file.path.startsWith(folderPath)) {
				const content = await this.app.vault.read(file)
				const match = content.match(/bookID:\s*(\d+)/)
				if (match) {
					bookIDs.push(match[1])
				}
			}
		}

		return bookIDs
	}

	async getTemplateContent () {
		let templatePath = this.settings.templateNote

		if (!templatePath) {
			new Notice(
				'Readsidian: No template path set. Please configure it in settings.'
			)
			return
		}

		// Make sure it ends with .md
		if (!templatePath.endsWith('.md')) {
			templatePath = templatePath + '.md'
		}
		const templateFile = this.app.vault.getAbstractFileByPath(
			templatePath
		) as TFile
		if (!templateFile) {
			new Notice('Template file not found')
			return
		}

		const templateContent = await this.app.vault.read(templateFile)

		return templateContent
	}
}

class ReadsidianSettingTab extends PluginSettingTab {
	plugin: Readsidian

	constructor (app: App, plugin: Readsidian) {
		super(app, plugin)
		this.plugin = plugin
	}

	display (): void {
		const { containerEl } = this

		containerEl.empty()

		new Setting(containerEl)
			.setName('GoodReads User ID')
			.setDesc('Type your GoodReads user ID.')
			.addText(text =>
				text
					.setPlaceholder('12356-your-user')
					.setValue(this.plugin.settings.goodReadsUserID)
					.onChange(async value => {
						this.plugin.settings.goodReadsUserID = value
						await this.plugin.saveSettings()
					})
			)

		new Setting(containerEl)
			.setName('Bookshelf')
			.setDesc('GoodReads shelf to get the books from')
			.addText(text =>
				text
					.setPlaceholder('read')
					.setValue(this.plugin.settings.bookshelf)
					.onChange(async value => {
						this.plugin.settings.bookshelf = value
						await this.plugin.saveSettings()
					})
			)

		new Setting(containerEl)
			.setName('Notes directory')
			.setDesc(
				'In which directory in your vault should the book notes be created?'
			)
			.addText(text =>
				text
					.setPlaceholder('myBooks')
					.setValue(this.plugin.settings.readsidianDirectory)
					.onChange(async value => {
						this.plugin.settings.readsidianDirectory = value
						await this.plugin.saveSettings()
					})
			)

		new Setting(containerEl)
			.setName('New book template')
			.setDesc('Set the template for the new book notes')
			.addText(text =>
				text
					.setPlaceholder('Temps/ReadsidianTemplate.md')
					.setValue(this.plugin.settings.templateNote)
					.onChange(async value => {
						this.plugin.settings.templateNote = value
						await this.plugin.saveSettings()
					})
			)
	}
}
