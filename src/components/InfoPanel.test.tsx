import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InfoPanel } from './InfoPanel';
import { useStore } from '../store/useStore';

describe('<InfoPanel />', () => {
  beforeEach(() => useStore.getState().resetView());

  it('prompts the user when nothing is selected', () => {
    render(<InfoPanel />);
    expect(screen.getByText(/Tap a muscle or bone/i)).toBeInTheDocument();
  });

  it('shows English and Latin names for the biceps', () => {
    useStore.getState().select('biceps-brachii');
    render(<InfoPanel />);
    expect(screen.getByRole('heading', { name: 'Biceps brachii' })).toBeInTheDocument();
    expect(screen.getByText('Musculus biceps brachii')).toBeInTheDocument();
  });

  it('lists the triceps as the opposing muscle of the biceps', () => {
    useStore.getState().select('biceps-brachii');
    render(<InfoPanel />);
    const heading = screen.getByRole('heading', { name: /Opposing muscles/i });
    expect(heading).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Triceps brachii' })).toBeInTheDocument();
  });

  it('shows Latin name as primary after switching language', () => {
    useStore.getState().select('triceps-brachii');
    useStore.getState().setLanguage('la');
    render(<InfoPanel />);
    expect(
      screen.getByRole('heading', { name: 'Musculus triceps brachii' }),
    ).toBeInTheDocument();
  });

  it('always shows the educational disclaimer', () => {
    useStore.getState().select('biceps-brachii');
    render(<InfoPanel />);
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
  });
});
