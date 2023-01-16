import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

(async () => {
  const pageId = '60721d2153964af7a66d19f4b9d4a6a7';
  const response = await notion.pages.retrieve({ page_id: pageId });
  console.log(response);
})();
