import { useLeafStore } from '../store/leaf-store';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('leaf-store', () => {
  beforeEach(() => {
    useLeafStore.getState().clearAllImages();
  });

  it('adds and removes captured images', () => {
    const image = {
      id: '1',
      uri: 'uri',
      filename: 'file.jpg',
      date: 'now',
      leafArea: 1,
      location: null,
    };
    const store = useLeafStore.getState();
    store.addCapturedImage(image);
    expect(useLeafStore.getState().capturedImages[0]).toEqual(image);

    store.removeCapturedImage('1');
    expect(useLeafStore.getState().capturedImages).toHaveLength(0);
  });

  it('clears all images', () => {
    const store = useLeafStore.getState();
    store.addCapturedImage({ id: '1', uri: 'a', filename: 'b', date: 'd', leafArea: 1, location: null });
    store.addCapturedImage({ id: '2', uri: 'c', filename: 'e', date: 'd', leafArea: 2, location: null });
    store.clearAllImages();
    expect(useLeafStore.getState().capturedImages).toEqual([]);
  });
});
