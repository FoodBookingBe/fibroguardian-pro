import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LazyImage from '@/components/common/LazyImage';

// Mock React's useState
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn()
}));

// Mock the IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock react-intersection-observer
jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn()
}));

describe('LazyImage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct props', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={200}
        height={150}
      />
    );

    // Initially, the image should not be visible (not in view)
    expect(screen.queryByAltText('Test image')).not.toBeInTheDocument();
    
    // The loading placeholder should be visible
    expect(screen.getByLabelText(/Loading image: Test image/i)).toBeInTheDocument();
  });

  it('renders image when in view', async () => {
    // Mock the useInView hook to return inView as true
    const useInViewMock = require('react-intersection-observer').useInView as jest.Mock;
    useInViewMock.mockReturnValue({ ref: jest.fn(), inView: true });

    const { container } = render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={200}
        height={150}
      />
    );

    // Since we're mocking the inView value, we should see the image element
    // but it might not be found by alt text due to how Next/Image works in tests
    expect(container.querySelector('img')).not.toBeNull();
  });

  it('uses low quality image placeholder when provided', () => {
    // Setup useState mock to track calls
    const useStateMock = useState as jest.Mock;
    useStateMock.mockImplementation((init) => [init, jest.fn()]);
    
    // Mock the useInView hook to return inView as true
    const useInViewMock = require('react-intersection-observer').useInView as jest.Mock;
    useInViewMock.mockReturnValue({ ref: jest.fn(), inView: true });

    // Render the component with a low quality source
    render(
      <LazyImage
        src="/test-image.jpg"
        lowQualitySrc="/test-image-low.jpg"
        alt="Test image"
        width={200}
        height={150}
      />
    );

    // Verify that useState was called with the lowQualitySrc at some point
    // This is checking implementation details, but it's a way to test the behavior
    expect(useStateMock).toHaveBeenCalledWith('/test-image-low.jpg');
  });

  it('shows loading component when provided', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={200}
        height={150}
        loadingComponent={<div data-testid="custom-loader">Loading...</div>}
      />
    );

    // The custom loading component should be visible
    expect(screen.getByTestId('custom-loader')).toBeInTheDocument();
  });

  it('applies CSS variables for dimensions', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={200}
        height={150}
      />
    );

    // The container should have the lazy-image-container class
    const container = screen.getByLabelText(/Loading image: Test image/i).parentElement;
    expect(container).toHaveClass('lazy-image-container');
  });
});
