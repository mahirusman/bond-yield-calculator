import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemaTypes';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'demo';
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

export default defineConfig({
  name: 'bond-yield-calculator-cms',
  title: 'Bond Yield Calculator CMS',
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Calculator Page')
              .id('calculatorPage')
              .child(S.document().schemaType('calculatorPage').documentId('calculatorPage')),
            S.listItem()
              .title('Site Settings')
              .id('siteSettings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.divider(),
            ...S.documentTypeListItems().filter(
              (listItem) => !['calculatorPage', 'siteSettings'].includes(listItem.getId() ?? '')
            ),
          ]),
    }),
    visionTool({ defaultApiVersion: '2026-01-01' }),
  ],
  schema: {
    types: schemaTypes,
  },
});
