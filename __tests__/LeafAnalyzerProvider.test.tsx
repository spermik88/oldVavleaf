/*
 * Тесты React компонента LeafAnalyzerProvider.
 * Использует utils/leaf-analyzer и мок OpenCVWorker.
 * Проверяет обработку результата WebView.
 */
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { LeafAnalyzerProvider, useLeafAnalyzer } from '../utils/leaf-analyzer';
import * as analyzerModule from '../utils/leaf-analyzer';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockSendImage = jest.fn();
const mockWaitUntilReady = jest.fn(() => Promise.resolve());
(global as any).triggerError = false;

jest.mock('../components/OpenCVWorker', () => {
  const React = require('react');
  const { forwardRef, useImperativeHandle, useEffect } = React;
  return forwardRef((props: any, ref: React.Ref<any>) => {
    useImperativeHandle(ref, () => ({
      sendImage: mockSendImage,
      waitUntilReady: mockWaitUntilReady,
    }));
    useEffect(() => {
      if ((global as any).triggerError) {
        props.onError?.('load error');
      } else {
        props.onResult?.({
          area: 5,
          pxPerCell: 1,
          contour: [],
          contourCount: 0,
          markerFound: true,
        });
      }
    }, []);
    return null;
  });
});

describe('LeafAnalyzerProvider', () => {
  it('handles result from WebView', async () => {
    const spy = jest.spyOn(analyzerModule.OpenCvAnalyzer.prototype, 'handleResult');

    render(
      <LeafAnalyzerProvider>
        <></>
      </LeafAnalyzerProvider>
    );

    await waitFor(() => expect(spy).toHaveBeenCalled());
  });

  it('keeps OpenCvAnalyzer on OpenCV load error', async () => {
    (global as any).triggerError = true;
    mockWaitUntilReady.mockImplementation(() => new Promise(() => {}));

    const TestChild = () => {
      const { analyzer } = useLeafAnalyzer();
      return (
        <Text testID="type">
          {analyzer instanceof analyzerModule.OpenCvAnalyzer ? 'opencv' : 'other'}
        </Text>
      );
    };

    const { queryByText, getByTestId } = render(
      <LeafAnalyzerProvider>
        <TestChild />
      </LeafAnalyzerProvider>
    );

    await waitFor(() => {
      expect(queryByText('Инициализация…')).toBeNull();
      expect(getByTestId('type').props.children).toBe('opencv');
    });
  });

  it('shows error banner on OpenCV load error', async () => {
    (global as any).triggerError = true;
    mockWaitUntilReady.mockImplementation(() => new Promise(() => {}));

    const Banner = () => {
      const { opencvError } = useLeafAnalyzer();
      return opencvError ? (
        <Text testID="banner">OpenCV не инициализирован</Text>
      ) : null;
    };

    const { getByTestId } = render(
      <LeafAnalyzerProvider>
        <Banner />
      </LeafAnalyzerProvider>
    );

    await waitFor(() => {
      expect(getByTestId('banner')).toBeTruthy();
    });
  });

  it('retries initialization after error', async () => {
    (global as any).triggerError = true;
    mockWaitUntilReady.mockImplementation(() => new Promise(() => {}));

    const spy = jest.spyOn(analyzerModule.OpenCvAnalyzer.prototype, 'handleResult');

    const { getByText } = render(
      <LeafAnalyzerProvider>
        <></>
      </LeafAnalyzerProvider>
    );

    await waitFor(() => getByText('Повторить'));

    (global as any).triggerError = false;
    mockWaitUntilReady.mockImplementation(() => Promise.resolve());

    fireEvent.press(getByText('Повторить'));

    await waitFor(() => expect(spy).toHaveBeenCalled());
  });
});

