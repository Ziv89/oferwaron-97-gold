// ============================================
// ErrorBoundary.jsx
// Catches render-time errors (e.g. a bad Firebase payload) and shows
// a friendly fallback instead of an all-white screen.
// ============================================
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Swap for your real logger / Sentry if you add one
    console.error('Render error caught by ErrorBoundary:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="strategy-section text-center">
          <h2 className="strategy-section-title">Something went wrong</h2>
          <p className="strategy-subtitle">
            Please refresh the page. If it keeps happening, contact us on WhatsApp.
          </p>
          <button className="strategy-btn strategy-btn-primary" onClick={this.handleReload}>
            Reload
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
