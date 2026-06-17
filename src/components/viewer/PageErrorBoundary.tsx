import { Component, type ReactNode } from "react";

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageIndex: number;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-50 rounded-lg m-4">
          <p className="text-red-600 font-medium">
            Failed to render page {this.props.pageIndex + 1}
          </p>
          <p className="text-red-500 text-sm mt-1">
            {this.state.error?.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
