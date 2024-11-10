import { beforeEach, describe, expect, it } from 'vitest';
import { TypedError } from '@telegram-apps/bridge';
import type { Signal } from '@telegram-apps/signals';

import { mockSSR } from '@test-utils/mockSSR.js';
import { mockMiniAppsEnv } from '@test-utils/mockMiniAppsEnv.js';

import { $version } from '@/scopes/globals.js';
import type { AnyFn } from '@/types.js';

import { testIsSupported } from './testIsSupported.js';

function cantCallErrPrefix(method: string, component?: string) {
  return `Unable to call the ${component ? `${component}.` : ''}${method}() ${component ? 'method' : 'function'}:`;
}

type FnWithMaybeIsSupported = AnyFn & {
  isSupported?(): boolean;
}

export function testSafety(fn: AnyFn, method: string, options: {
  component?: string;
  isMounted?: Signal<boolean>;
}): void;

export function testSafety(fn: FnWithMaybeIsSupported, method: string, options: {
  isMounted?: Signal<boolean>;
  component?: string;
  minVersion: string;
}): void;

export function testSafety(fn: FnWithMaybeIsSupported, method: string, {
  component,
  minVersion,
  isMounted,
}: {
  isMounted?: Signal<boolean>;
  component?: string;
  minVersion?: string;
}) {
  let prevVersion: string | undefined;
  if (minVersion) {
    const [a, b = 0] = minVersion.split('.').map(Number);
    prevVersion = `${b === 0 ? a - 1 : a}.${b === 0 ? 99 : b - 1}`;
  }

  // Require running inside Mini Apps.
  it('should throw ERR_UNKNOWN_ENV if not in Mini Apps', () => {
    const err = new TypedError(
      'ERR_UNKNOWN_ENV',
      `${cantCallErrPrefix(method, component)} it can't be called outside Mini Apps`,
    );
    expect(fn).toThrow(err);
    mockMiniAppsEnv();
    expect(fn).not.toThrow(err);
  });

  // Require running outside server.
  it('should throw ERR_UNKNOWN_ENV if called on the server', () => {
    mockSSR();
    expect(fn).toThrow(
      new TypedError(
        'ERR_UNKNOWN_ENV',
        `${cantCallErrPrefix(method, component)} it can't be called outside Mini Apps`,
      ),
    );
  });

  describe('mini apps env', () => {
    beforeEach(mockMiniAppsEnv);

    // Require initializing the SDK.
    it('should throw ERR_NOT_INITIALIZED if package is not initialized', () => {
      const err = new TypedError(
        'ERR_NOT_INITIALIZED',
        `${cantCallErrPrefix(method, component)} the SDK was not initialized. Use the SDK init() function`,
      );
      expect(fn).toThrow(err);
      $version.set('10');
      expect(fn).not.toThrow(err);
    });

    describe.runIf(fn.isSupported)('package initialized', () => {
      beforeEach(() => {
        $version.set('6.0');
      });

      // Require running with some minimal Mini Apps version.
      it(`should throw ERR_NOT_SUPPORTED if Mini Apps version is less than ${minVersion}`, () => {
        $version.set(prevVersion!);
        expect(fn).toThrow(
          new TypedError(
            'ERR_NOT_SUPPORTED',
            `${cantCallErrPrefix(method, component)} it is unsupported in Mini Apps version ${prevVersion}`,
          ),
        );

        $version.set(minVersion!);
        expect(fn).not.toThrow(
          new TypedError(
            'ERR_NOT_SUPPORTED',
            `${cantCallErrPrefix(method, component)} it is unsupported in Mini Apps version ${minVersion}`,
          ),
        );
      });

      describe.runIf(isMounted)(`Mini Apps version is ${minVersion}`, () => {
        beforeEach(() => {
          $version.set(minVersion!);
        });

        // Require parent component mount.
        it(`should throw ERR_NOT_MOUNTED if ${component} is not mounted`, () => {
          expect(fn).toThrow(
            new TypedError(
              'ERR_NOT_MOUNTED',
              `${cantCallErrPrefix(method, component)} the component is not mounted. Use the ${component}.mount() method`,
            ),
          );
        });

        describe('mounted', () => {
          beforeEach(() => {
            isMounted!.set(true);
          });

          // Check if function is not throwing errors when all requirements were met.
          it('should not throw', () => {
            expect(fn).not.toThrow();
          });
        });
      });
    });
  });

  describe.runIf(fn.isSupported)('isSupported', () => {
    testIsSupported(fn.isSupported!, minVersion!);
  });
}