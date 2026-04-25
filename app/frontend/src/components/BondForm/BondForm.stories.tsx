import type { Meta, StoryObj } from '@storybook/react-vite';
import { BondForm } from './BondForm';

const submitBondForm = async () => undefined;

const meta = {
  title: 'Calculator/BondForm',
  component: BondForm,
  tags: ['autodocs'],
  args: {
    loading: false,
    onSubmit: submitBondForm,
  },
} satisfies Meta<typeof BondForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const Calculating: Story = {
  args: {
    loading: true,
  },
};
