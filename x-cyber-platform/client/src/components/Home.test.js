import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Home from './Home';

describe('Home Component', () => {
  it('renders welcome message when user is not logged in', () => {
    render(
      <AuthContext.Provider value={{ user: null }}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Welcome to X-Cyber')).toBeInTheDocument();
    expect(screen.getByText(/Please log in or register to get started./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register');
  });

  it('renders welcome message with username when user is logged in', () => {
    const user = { username: 'testuser' };
    render(
      <AuthContext.Provider value={{ user }}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Welcome to X-Cyber')).toBeInTheDocument();
    expect(screen.getByText(`Hello, ${user.username}! Explore the Posts page to see and create posts.`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Posts/i })).toHaveAttribute('href', '/posts');
  });
});