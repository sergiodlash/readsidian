# Readsidian Plugin

Readsidian is a small plugin for [Obsidian](https://obsidian.md) to automatically create notes for the books in your [Goodreads](https://www.goodreads.com) shelves.

The plugin uses Goodreads RSS feed to create a note for the books in the shelf specified in the settings.

## Setup

Create a template note, like the example provided in `Readsidian Template.md`.

To avoid duplicates, your book note **must** contain the property `bookID: {{ book_id }}`. This is Goodreads' unique identifier that is used to avoid duplicated imports.

In the plugin settings, set your user ID, the name of the bookshelf you wish to import, the target directory in your vault where the notes should be created, and the path to the template note.

To get your user id, go to your goodreads profile url and copy the last part. For example, if your profile url is `https://www.goodreads.com/user/show/123456789-example-user-id` then your user ID is `123456789-example-user-id`.

## Usage

You can call the import command from the command palette to import new books into your vault. You can also click the the readsidian book icon from the left ribbon to call the import command.

---

## Acknowledgements

Please, reach out for feature requests and if you would like to help further develop this idea!
