import { Component, type ReactNode } from 'react';

type Props = { fallback: ReactNode; children: ReactNode };
type State = { failed: boolean };

/**
 * If the glTF model fails to load or parse, render the placeholder arm instead
 * so the app stays usable (MVP requires a working fallback).
 */
export class ModelErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Arm model failed to load; using placeholder geometry.', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
