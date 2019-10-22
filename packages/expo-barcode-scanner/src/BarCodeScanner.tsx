import { UnavailabilityError } from '@unimodules/core';
import mapValues from 'lodash/mapValues';
import PropTypes from 'prop-types';
import React from 'react';
import { Platform, ViewProps, ViewPropTypes } from 'react-native';

import ExpoBarCodeScannerModule from './ExpoBarCodeScannerModule';
import ExpoBarCodeScannerView from './ExpoBarCodeScannerView';

const { BarCodeType, Type } = ExpoBarCodeScannerModule;

const EVENT_THROTTLE_MS = 500;

type BarCodeEvent = {
  type: string;
  data: string;
  [key: string]: any;
};

export type BarCodeEventCallbackArguments = {
  nativeEvent: BarCodeEvent;
};

export type BarCodeScannedCallback = (params: BarCodeEvent) => void;

export const PermissionsStatus = {
  GRANTED: 'granted',
  UNDETERMINED: 'undetermined',
  DENIED: 'denied',
} as const;

export type PermissionsResponse = {
  status: typeof PermissionsStatus[keyof typeof PermissionsStatus];
  expires: 'never' | number;
  granted: boolean;
};

export interface BarCodeScannerProps extends ViewProps {
  type?: 'front' | 'back' | number;
  barCodeTypes?: string[];
  onBarCodeScanned: BarCodeScannedCallback;
}

export class BarCodeScanner extends React.Component<BarCodeScannerProps> {
  lastEvents: { [key: string]: any } = {};
  lastEventsTimes: { [key: string]: any } = {};

  static Constants = {
    BarCodeType,
    Type,
  };

  static ConversionTables = {
    type: Type,
  };

  static propTypes = {
    ...ViewPropTypes,
    onBarCodeScanned: PropTypes.func,
    barCodeTypes: PropTypes.array,
    type: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };

  static defaultProps = {
    type: Type.back,
    barCodeTypes: Object.values(BarCodeType),
  };

  static async getPermissionsAsync(): Promise<PermissionsResponse> {
    return ExpoBarCodeScannerModule.getPermissionsAsync();
  }

  static async requestPermissionsAsync(): Promise<PermissionsResponse> {
    return ExpoBarCodeScannerModule.requestPermissionsAsync();
  }

  static async scanFromURLAsync(
    url: string,
    barCodeTypes: string[] = Object.values(BarCodeType)
  ): Promise<{ type: string; data: string }> {
    if (!ExpoBarCodeScannerModule.scanFromURLAsync) {
      throw new UnavailabilityError('expo-barcode-scanner', 'scanFromURLAsync');
    }
    if (Array.isArray(barCodeTypes) && !barCodeTypes.length) {
      throw new Error('No barCodeTypes specified; provide at least one barCodeType for scanner');
    }

    if (Platform.OS === 'ios') {
      if (Array.isArray(barCodeTypes) && !barCodeTypes.includes(BarCodeType.qr)) {
        // Only QR type is supported on iOS, fail if one tries to use other types
        throw new Error('Only QR type is supported by scanFromURLAsync() on iOS');
      }
      // on iOS use only supported QR type
      return await ExpoBarCodeScannerModule.scanFromURLAsync(url, [BarCodeType.qr]);
    }

    // On other platforms, if barCodeTypes is not provided, use all available types
    return await ExpoBarCodeScannerModule.scanFromURLAsync(url, barCodeTypes);
  }

  render() {
    const nativeProps = this.convertNativeProps(this.props);
    const { onBarCodeScanned } = this.props;
    return (
      <ExpoBarCodeScannerView
        {...nativeProps}
        onBarCodeScanned={this.onObjectDetected(onBarCodeScanned)}
      />
    );
  }

  // coordinates of cornerPoints and boundingBox are represented in DP (Display-Indepent Points) unit
  // React Native is using the same unit
  onObjectDetected = (callback?: BarCodeScannedCallback) => ({
    nativeEvent,
  }: BarCodeEventCallbackArguments) => {
    const { type } = nativeEvent;
    if (
      this.lastEvents[type] &&
      this.lastEventsTimes[type] &&
      JSON.stringify(nativeEvent) === this.lastEvents[type] &&
      Date.now() - this.lastEventsTimes[type] < EVENT_THROTTLE_MS
    ) {
      return;
    }

    if (callback) {
      callback(nativeEvent);
      this.lastEventsTimes[type] = new Date();
      this.lastEvents[type] = JSON.stringify(nativeEvent);
    }
  };

  convertNativeProps(props: BarCodeScannerProps) {
    const newProps = mapValues(props, this.convertProp);
    return newProps;
  }

  convertProp(value: any, key: string): any {
    if (typeof value === 'string' && BarCodeScanner.ConversionTables[key]) {
      return BarCodeScanner.ConversionTables[key][value];
    }
    return value;
  }
}

export const { Constants, getPermissionsAsync, requestPermissionsAsync } = BarCodeScanner;
