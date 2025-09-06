import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactForm from './ContactForm';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = vi.fn();

// Mock window.location
const originalLocation = window.location;
const mockLocation = (pathname: string) => {
    Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, pathname },
    });
};

describe('ContactForm', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // Default to English
        mockLocation('/en/contact');
    });

    afterAll(() => {
        // Restore original window.location
        Object.defineProperty(window, 'location', {
            writable: true,
            value: originalLocation,
        });
    });

    it('should render the form with all fields in English', () => {
        render(<ContactForm />);

        expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email \*/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument();
    });

    it('should render the form with all fields in German', () => {
        mockLocation('/de/kontakt');
        render(<ContactForm />);

        expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/E-Mail \*/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Betreff/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Telefon/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nachricht/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Nachricht senden/i })).toBeInTheDocument();
    });

    it('should show validation errors for required fields', async () => {
        render(<ContactForm />);

        fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

        expect(await screen.findByText('Name is required')).toBeInTheDocument();
        expect(await screen.findByText('Email is required')).toBeInTheDocument();
        expect(await screen.findByText('Subject is required')).toBeInTheDocument();
        expect(await screen.findByText('Message is required')).toBeInTheDocument();
    });

    it('should submit the form with valid data', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });

        render(<ContactForm />);

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Email \*/i), { target: { value: 'john.doe@example.com' } });
        fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: 'Test Subject' } });
        fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: 'This is a test message that is long enough.' } });

        fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/contact', expect.any(Object));
        });

        expect(await screen.findByText('Success!')).toBeInTheDocument();
    });
});
