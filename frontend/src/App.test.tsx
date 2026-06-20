import { render, screen } from '@testing-library/react'
import App from './App'

test('renders Smart Task Hub header', () => {
  render(<App />)
  expect(screen.getByText('Smart Task Hub')).toBeInTheDocument()
})
