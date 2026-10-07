import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return (
      <div className="inline-error" role="alert">
        <p>This page could not be displayed. Reload to fetch the latest application.</p>
        <button className="text-button" onClick={() => window.location.reload()}>Reload application</button>
      </div>
    );
    return this.props.children;
  }
}
