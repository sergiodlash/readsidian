import Parser from 'rss-parser';

// Define the custom interface for the feed
interface CustomFeed {
  title: string;
  copyright: string;
  link: string;
  atomLink: string;
  description: string;
  language: string;
  lastBuildDate: string;
  ttl: string;
  image: {
    title: string;
    link: string;
    width: number;
    height: number;
    url: string;
  };
}

// Define the custom interface for each item
interface CustomItem {
  guid: string;
  pubDate: string;
  title: string;
  link: string;
  book_id: string;
  book_image_url: string;
  book_small_image_url: string;
  book_medium_image_url: string;
  book_large_image_url: string;
  book_description: string;
  author_name: string;
  isbn: string;
  user_name: string;
  user_rating: number;
  user_read_at: string;
  user_date_added: string;
  user_date_created: string;
  user_shelves: string;
  user_review: string;
  average_rating: number;
  book_published: string;
  description: string;
}

// Initialize the RSS parser with custom fields for feed and item
export const goodReadsParser: Parser<CustomFeed, CustomItem> = new Parser({
  customFields: {
    feed: ['title', 'copyright', 'link', 'atomLink', 'description', 'language', 'lastBuildDate', 'ttl', 'image'],
    item: [
      'guid',
      'pubDate',
      'title',
      'link',
      'book_id',
      'book_image_url',
      'book_small_image_url',
      'book_medium_image_url',
      'book_large_image_url',
      'book_description',
      'author_name',
      'isbn',
      'user_name',
      'user_rating',
      'user_read_at',
      'user_date_added',
      'user_date_created',
      'user_shelves',
      'user_review',
      'average_rating',
      'book_published',
      'description'
    ]
  }
});