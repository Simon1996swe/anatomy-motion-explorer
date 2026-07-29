import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';
import { useStore } from '../store/useStore';

describe('<SearchBar />', () => {
  beforeEach(() => useStore.getState().resetView());

  it('shows matching results and selects one', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'biceps');
    const option = await screen.findByRole('button', { name: /Biceps brachii/i });
    await user.click(option);
    expect(useStore.getState().selectedId).toBe('biceps-brachii');
  });

  it('searches by Latin name', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    await user.type(screen.getByRole('searchbox'), 'os humeri');
    expect(await screen.findByText(/Humerus/i)).toBeInTheDocument();
  });

  it('shows an empty state for unknown terms', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    await user.type(screen.getByRole('searchbox'), 'zzzzz');
    expect(await screen.findByText(/No structures found/i)).toBeInTheDocument();
  });
});
