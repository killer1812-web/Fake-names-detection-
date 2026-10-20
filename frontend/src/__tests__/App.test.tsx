import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Badge } from '../components/Badge';
import { StatCard } from '../components/StatCard';
import { Users } from 'lucide-react';

describe('Frontend Component Tests', () => {
  it('renders Badge with correct status style', () => {
    const { getByText } = render(<Badge status="VALID" />);
    expect(getByText('VALID')).toBeInTheDocument();
  });

  it('renders StatCard with title, value, and subtitle', () => {
    const { getByText } = render(
      <StatCard
        title="Total Records"
        value="10,500"
        subtitle="Analyzed profiles"
        icon={Users}
      />
    );
    expect(getByText('Total Records')).toBeInTheDocument();
    expect(getByText('10,500')).toBeInTheDocument();
    expect(getByText('Analyzed profiles')).toBeInTheDocument();
  });
});
