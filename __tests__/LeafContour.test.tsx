/*
 * Тесты компонента LeafContour.
 * Используется react-test-renderer и React.
 * Проверяется корректный рендер и отсутствие ошибок.
 */
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import LeafContour from '../components/LeafContour';

describe('LeafContour', () => {
  it('renders without crashing when points are provided', () => {
    expect(() => {
      act(() => {
        renderer.create(
          <LeafContour points={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} />
        );
      });
    }).not.toThrow();
  });

  it('returns null when no points provided', () => {
    let tree: renderer.ReactTestRenderer | null = null;
    act(() => {
      tree = renderer.create(<LeafContour points={[]} />);
    });
    expect(tree!.toJSON()).toBeNull();
  });
});
