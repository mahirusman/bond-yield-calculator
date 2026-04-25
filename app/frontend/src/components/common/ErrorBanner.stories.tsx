import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorBanner } from './ErrorBanner';

const meta = {
  title: 'Common/ErrorBanner',
  component: ErrorBanner,
  tags: ['autodocs'],
  args: {
    message: 'Unable to calculate the bond yield. Please check the input values.',
  },
} satisfies Meta<typeof ErrorBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
