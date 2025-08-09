import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Goals from './Goals';
import '@testing-library/jest-dom';

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('Goals Component', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  test('renders loading state initially', () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(<Goals />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders empty state when no goals', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(<Goals />);
    
    await waitFor(() => {
      expect(screen.getByText(/no goals found/i)).toBeInTheDocument();
    });
  });

  test('renders goals list when data is available', async () => {
    const mockGoals = [
      {
        _id: '1',
        title: 'Test Goal',
        category: 'co2_reduction',
        target: { value: 100, unit: 'kg' },
        currentProgress: 50,
        deadline: '2024-12-31',
        status: 'active'
      }
    ];
    
    axios.get.mockResolvedValueOnce({ data: mockGoals });
    render(<Goals />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Goal')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  test('handles goal creation', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.post.mockResolvedValueOnce({ 
      data: { 
        _id: '2', 
        title: 'New Goal', 
        category: 'water_saving',
        target: { value: 50, unit: 'liters' },
        currentProgress: 0,
        deadline: '2024-12-31',
        status: 'active'
      } 
    });
    
    render(<Goals />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText(/create goal/i));
    });
    
    // Test goal creation form
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    render(<Goals />);
    
    await waitFor(() => {
      expect(screen.getByText(/error loading goals/i)).toBeInTheDocument();
    });
  });
});
