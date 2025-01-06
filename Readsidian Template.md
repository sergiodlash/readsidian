---
type: readsidianBooks
bookID: {{ book_id }}
author: "[[{{ author_name }}]]"
isbn: {{ isbn }}
rating: {{ user_rating }}
---
# {{ title }}
**[[{{author_name}}]]**

<a href="{{ guid }}" target="_blank" style="text-decoration: none;">
  <img src="{{ book_large_image_url }}" alt="{{ title }}" style="max-width: 250px; border-radius: 8px;">
</a> 

> [!Summary]
> {{ book_description | safe | replace(r/<br\s*\/?>/g, "\n") | replace("\n\n", "\n​\n") }}
> 

---
### Additional Details

- **ISBN:** {{ isbn }}
- **Your Rating:** {{ user_rating }}
- **Read At:** {{ user_read_at }}
- **Added on:** {{ user_date_added }}
- **Your Review:** {{ user_review | safe | replace(r/<br\s*\/?>/g, "\n") |  replace("\n\n", "\n​\n")  }}

---
# Notes









---

### Links

- [Goodreads Review Link]({{ link }})
