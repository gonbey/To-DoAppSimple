import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('Debug: Initializing application');
const rootElement = document.getElementById('root');
console.log('Debug: Root element found:', rootElement);

if (rootElement) {
  console.log('Debug: Creating React root');
  const root = createRoot(rootElement);
  console.log('Debug: Rendering application');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('Debug: Application rendered');
} else {
  console.error('Debug: Root element not found');
}
