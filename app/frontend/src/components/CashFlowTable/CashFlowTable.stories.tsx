import type { Meta, StoryObj } from '@storybook/react-vite';
import { sampleCashFlowSchedule } from '../../stories/bondStoryFixtures';
import { CashFlowTable } from './CashFlowTable';

const meta = {
  title: 'Calculator/CashFlowTable',
  component: CashFlowTable,
  tags: ['autodocs'],
  args: {
    schedule: sampleCashFlowSchedule,
  },
} satisfies Meta<typeof CashFlowTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const StandardSchedule: Story = {};
