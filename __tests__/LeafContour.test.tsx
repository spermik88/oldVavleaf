import React from 'react';
import renderer from 'react-test-renderer';
import LeafContour from '../components/LeafContour';

describe('LeafContour', () => {
  it('renders without crashing when points are provided', () => {
    expect(() => {
      renderer.create(
        <LeafContour points={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} />
      );
    }).not.toThrow();
  });

  it('returns null when no points provided', () => {
    const tree = renderer.create(<LeafContour points={[]} />).toJSON();
    expect(tree).toBeNull();
  });
});
