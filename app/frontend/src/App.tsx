import React from 'react';
import { BondForm } from './components/BondForm/BondForm';
import { ResultsPanel } from './components/ResultsPanel/ResultsPanel';
import { useBondCalculator } from './hooks/useBondCalculator';

export default function App() {
  const { result, loading, error, calculate } = useBondCalculator();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Bond Yield Calculator</h1>
        <p>Calculate key metrics and cash flow schedules for fixed-income instruments</p>
      </header>

      <main className="app-main">
        <section className="form-section">
          <BondForm onSubmit={calculate} loading={loading} />
        </section>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {result && (
          <section className="results-section">
            <ResultsPanel result={result} />
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>Bond Yield Calculator — Financial calculations performed server-side</p>
      </footer>
    </div>
  );
}
