import { useSettingsStore } from '../store/settings-store';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('settings-store', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      highResolutionCapture: true,
      saveGpsData: true,
      manualFocusOnly: true,
    });
  });

  it('toggles high resolution capture', () => {
    const store = useSettingsStore.getState();
    store.toggleHighResolutionCapture();
    expect(useSettingsStore.getState().highResolutionCapture).toBe(false);
  });

  it('toggles saveGpsData', () => {
    const store = useSettingsStore.getState();
    store.toggleSaveGpsData();
    expect(useSettingsStore.getState().saveGpsData).toBe(false);
  });

  it('toggles manualFocusOnly', () => {
    const store = useSettingsStore.getState();
    store.toggleManualFocusOnly();
    expect(useSettingsStore.getState().manualFocusOnly).toBe(false);
  });
});
