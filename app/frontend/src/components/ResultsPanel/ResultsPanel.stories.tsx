import type { Meta, StoryObj } from '@storybook/react-vite';
import { sampleBondResult } from '../../stories/bondStoryFixtures';
import { ResultsPanel } from './ResultsPanel';

const meta = {
  title: 'Calculator/ResultsPanel',
  component: ResultsPanel,
  tags: ['autodocs'],
  args: {
    result: sampleBondResult,
  },
} satisfies Meta<typeof ResultsPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithResults: Story = {};

export const Empty: Story = {
  args: {
    result: null,
  },
};
