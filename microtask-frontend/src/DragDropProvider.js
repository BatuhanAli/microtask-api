import React from 'react';

// Lazy import for better performance and error handling
let DndContext;
try {
  DndContext = require('@dnd-kit/core').DndContext;
} catch (error) {
  console.warn('Failed to load @dnd-kit/core:', error.message);
}

// Fallback component for when drag-and-drop is not available
export function DragDropFallback({ children }) {
  return <div className="drag-drop-fallback">{children}</div>;
}

// Error boundary for drag-and-drop operations
class DragDropErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Drag and drop error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <DragDropFallback>{this.props.children}</DragDropFallback>;
    }

    return this.props.children;
  }
}

// Basic DndContext wrapper component for drag-and-drop functionality
export function DragDropProvider({ children, onDragEnd }) {
  // If DndContext is not available, use fallback
  if (!DndContext) {
    return <DragDropFallback>{children}</DragDropFallback>;
  }

  return (
    <DragDropErrorBoundary>
      <DndContext onDragEnd={onDragEnd}>
        {children}
      </DndContext>
    </DragDropErrorBoundary>
  );
}

// Hook to check if drag-and-drop is available
export function useDragDropAvailable() {
  try {
    // Simple check to see if @dnd-kit is available
    require('@dnd-kit/core');
    return true;
  } catch (error) {
    console.warn('Drag and drop library not available, falling back to basic functionality');
    return false;
  }
}