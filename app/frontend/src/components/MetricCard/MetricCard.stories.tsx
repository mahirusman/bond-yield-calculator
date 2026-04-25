import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetricCard } from './MetricCard';

const meta = {
  title: 'Calculator/MetricCard',
  component: MetricCard,
  tags: ['autodocs'],
  args: {
    title: 'Yield to Maturity (YTM)',
    value: '7.1427%',
    description: 'Total annualized return if held to maturity',
  },
} satisfies Meta<typeof MetricCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAccent: Story = {
  args: {
    title: 'Discount',
    value: '$50.00',
    description: 'Bond trades below face value',
    accentColor: '#dc2626',
  },
};
