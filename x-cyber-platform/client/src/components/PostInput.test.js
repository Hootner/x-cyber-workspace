import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PostInput from './PostInput';

describe('PostInput Component', () => {
  const mockOnSubmit = jest.fn();

  it('renders the form correctly', () => {
    render(<PostInput onSubmit={mockOnSubmit} loading={false} />);

    expect(screen.getByText('Create a New Post')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Post/i })).toBeInTheDocument();
  });

  it('displays image preview when an image is selected', () => {
    render(<PostInput onSubmit={mockOnSubmit} loading={false} />);

    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/image/i);
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    const img = screen.getByAltText('Preview');
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('blob:');
  });

  it('clears image preview when no image is selected', () => {
    render(<PostInput onSubmit={mockOnSubmit} loading={false} />);

    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/image/i);
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);
    expect(screen.getByAltText('Preview')).toBeInTheDocument();

    Object.defineProperty(input, 'files', {
      value: [],
    });
    fireEvent.change(input);
    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
  });

  it('calls onSubmit with correct data when form is submitted', () => {
    render(<PostInput onSubmit={mockOnSubmit} loading={false} />);

    const titleInput = screen.getByPlaceholderText('Title');
    const contentInput = screen.getByPlaceholderText('Content');
    const fileInput = screen.getByLabelText(/image/i);
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(contentInput, { target: { value: 'Test Content' } });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitButton = screen.getByRole('button', { name: /Create Post/i });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'Test Title',
      content: 'Test Content',
      image: file,
    });
  });

  it('disables inputs when loading', () => {
    render(<PostInput onSubmit={mockOnSubmit} loading={true} />);

    expect(screen.getByPlaceholderText('Title')).toBeDisabled();
    expect(screen.getByPlaceholderText('Content')).toBeDisabled();
    expect(screen.getByLabelText(/image/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /Creating.../i })).toBeDisabled();
  });

  it('shows alert if title or content is missing', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    render(<PostInput onSubmit={mockOnSubmit} loading={false} />);

    const submitButton = screen.getByRole('button', { name: /Create Post/i });
    fireEvent.click(submitButton);

    expect(alertSpy).toHaveBeenCalledWith('Title and content are required');
    expect(mockOnSubmit).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});