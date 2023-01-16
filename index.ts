import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { Client } from '@notionhq/client';
import axios from 'axios';

dotenv.config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

declare function Boolean<T>(x: T | false | 0 | '' | null | undefined): x is T;

(async () => {
  const pageId = '60721d2153964af7a66d19f4b9d4a6a7';
  const { results } = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 50,
  });

  const bulletItems = results
    .map((o) => ('type' in o && o.type === 'bulleted_list_item' ? o : null))
    .filter(Boolean);
  const subBullets = await Promise.all(
    bulletItems.map(
      async (bullet) =>
        await notion.blocks.children.list({
          block_id: bullet!.id,
        })
    )
  );
  const keyedSubBullets: Record<string, (typeof subBullets)[number]> = {};
  subBullets.forEach((subBullet, index) => {
    keyedSubBullets[bulletItems[index]!.id] = subBullet;
  });
  console.log(
    bulletItems.map((o) => JSON.stringify(o.bulleted_list_item.rich_text))
  );
  console.log(keyedSubBullets);
  debugger;

  const childDb = results
    .map((o) => ('type' in o && o.type === 'child_database' ? o : null))
    .filter(Boolean)[0];
  console.log('childDb', childDb?.id);
  let childDbId: string;
  if (childDb) {
    childDbId = childDb.id;
  } else {
    const options = {
      method: 'POST',
      url: 'https://api.notion.com/v1/databases',
      headers: {
        accept: 'application/json',
        'Notion-Version': '2022-06-28',
        'content-type': 'application/json',
        Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      },
      data: {
        title: [
          {
            type: 'text',
            text: { content: 'The Daily Stoic' },
          },
        ],
        parent: { page_id: pageId },
        properties: {
          Title: {
            title: {},
          },
          Date: { date: {} },
          Notes: { rich_text: {} },
        },
      },
    };
    const response = await axios.request(options);
    childDbId = response.data.id;
  }

  for (const bulletItem of bulletItems) {
    const elem0 = bulletItem.bulleted_list_item.rich_text[0];
    const date =
      elem0.type === 'mention' && elem0.mention.type === 'date'
        ? elem0.mention.date
        : null;
    const elem1 = bulletItem.bulleted_list_item.rich_text[1];
    const title = elem1.type === 'text' ? elem1.text : null;

    const pageResponse = await notion.pages.create({
      parent: {
        type: 'database_id',
        database_id: childDbId,
      },
      properties: {
        Title: {
          type: 'title',
          title: [
            {
              text: title,
            },
          ],
        },
        Date: {
          type: 'date',
          date,
        },
        Notes: {
          type: 'rich_text',
          rich_text: keyedSubBullets[bulletItem.id].results.length
            ? [
                {
                  type: 'text',
                  text: {
                    content: keyedSubBullets[bulletItem.id].results
                      .map((result) =>
                        'type' in result && result.type === 'bulleted_list_item'
                          ? result.bulleted_list_item.rich_text[0]!.plain_text
                          : null
                      )
                      .filter(Boolean)
                      .join('\n\n'),
                  },
                },
              ]
            : [],
        },
      },
    });
    /*
    await notion.blocks.children.append({
      block_id: pageResponse.id,
      children: keyedSubBullets[bulletItem.id].results as any,
    });
    */
  }
})();
