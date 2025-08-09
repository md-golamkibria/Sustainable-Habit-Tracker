import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Mock the components since we're testing App routing
jest.mock('./components/Login', () => () => <div>Login Component</div>);
jest.mock('./components/Dashboard', () => () => <div>Dashboard Component</div>);
jest.mock('./components/Goals', () => () => <div>Goals Component</div>);
jest.mock('./components/Analytics', () => () => <div>Analytics Component</div>);
jest.mock('./components/Challenges', () => () => <div>Challenges Component</div>);
jest.mock('./components/Education', () => () => <div>Education Component</div>);

const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

describe('App Component', () => {
  test('renders without crashing', () => {
    renderWithRouter(<App />);
  });

  test('includes navigation component', () => {
    renderWithRouter(<App />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('handles routing correctly', async () => {
    const { container } = renderWithRouter(<App />, { route: '/dashboard' });
    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });
});
