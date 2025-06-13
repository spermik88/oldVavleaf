import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { LeafAnalyzerProvider } from '../utils/leaf-analyzer';
import * as analyzerModule from '../utils/leaf-analyzer';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockSendImage = jest.fn();
const mockWaitUntilReady = jest.fn(() => Promise.resolve());

jest.mock('../components/OpenCVWorker', () => {
  const React = require('react');
  const { forwardRef, useImperativeHandle, useEffect } = React;
  return forwardRef((props: any, ref: React.Ref<any>) => {
    useImperativeHandle(ref, () => ({
      sendImage: mockSendImage,
      waitUntilReady: mockWaitUntilReady,
    }));
    useEffect(() => {
      props.onResult?.({
        area: 5,
        pxPerCell: 1,
        contour: [],
        contourCount: 0,
        markerFound: true,
      });
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
});
