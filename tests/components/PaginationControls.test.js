import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import PaginationControls from '../../components/PaginationControls';

const base = { currentPage: 0, totalPages: 3, totalItems: 25, currentItemCount: 10 };
test('muestra rango y permite siguiente pero bloquea anterior al inicio', async () => {
  const onNext = jest.fn(), onPrevious = jest.fn();
  await render(<PaginationControls {...base} onNext={onNext} onPrevious={onPrevious} />);
  expect(screen.getByText(/Mostrando 1–10 de 25/)).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  await fireEvent.press(screen.getByText('Anterior'));
  await fireEvent.press(screen.getByText('Siguiente'));
  expect(onPrevious).not.toHaveBeenCalled();
  expect(onNext).toHaveBeenCalledTimes(1);
});
test('permite anterior y bloquea siguiente en la última página', async () => {
  const onPrevious = jest.fn(), onNext = jest.fn();
  await render(<PaginationControls {...base} currentPage={2} currentItemCount={5} onPrevious={onPrevious} onNext={onNext} />);
  expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  await fireEvent.press(screen.getByText('Siguiente'));
  await fireEvent.press(screen.getByText('Anterior'));
  expect(onPrevious).toHaveBeenCalledTimes(1);
  expect(onNext).not.toHaveBeenCalled();
});
test('bloquea ambos controles durante carga', async () => {
  await render(<PaginationControls {...base} currentPage={1} loading />);
  expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
});
