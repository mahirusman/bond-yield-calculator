import React from 'react';

export function Loader() {
  return (
    <div className="loader" role="status" aria-label="Loading">
      <span className="loader-spinner" />
      <span className="loader-text">Calculating...</span>
    </div>
  );
}
