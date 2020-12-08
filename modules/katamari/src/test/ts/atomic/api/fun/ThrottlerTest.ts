import { Assert, UnitTest } from '@ephox/bedrock-client';
import * as Throttler from 'ephox/katamari/api/Throttler';

const testAdaptable = (expectedDataAfterFirst: string[], expectedDataAfterSecond: string[], options?: { leading?: boolean; trailing?: boolean }, flush: boolean = false) => (success: UnitTest.SuccessCallback, failure: UnitTest.FailureCallback) => {
  const data: string[] = [];
  const throttler = Throttler.adaptable((value: string) => {
    data.push(value);
  }, 50, options);

  const assertInTimeout = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      failure(e);
    }
  };

  throttler.throttle('cat');
  throttler.throttle('dog');
  throttler.throttle('elephant');
  if (flush === true && throttler.flush) {
    throttler.flush();
  }
  throttler.throttle('frog');

  setTimeout(() => {
    assertInTimeout(() => Assert.eq('eq', expectedDataAfterFirst, data));
    throttler.throttle('frog-goose');
    throttler.throttle('duck');
    if (flush === true && throttler.flush) {
      throttler.flush();
    }
    throttler.throttle('goose');
    setTimeout(() => {
      assertInTimeout(() => Assert.eq('eq', expectedDataAfterSecond, data));
      success();
    }, 120);
  }, 120);
};

UnitTest.asynctest('Throttler.adaptable', testAdaptable([ 'frog' ], [ 'frog', 'goose' ]));
UnitTest.asynctest('Throttler.adaptable with leading set to true', testAdaptable([ 'cat' ], [ 'cat', 'frog-goose' ], { leading: true }));
UnitTest.asynctest('Throttler.adaptable with trailing set to true', testAdaptable([ 'frog' ], [ 'frog', 'goose' ], { trailing: true }));
UnitTest.asynctest('Throttler.adaptable with leading and trailing set to true', testAdaptable([ 'cat', 'frog' ], [ 'cat', 'frog', 'frog-goose', 'goose' ], { leading: true, trailing: true }));
UnitTest.asynctest('Throttler.adaptable and using flush()', testAdaptable([ 'elephant', 'frog' ], [ 'elephant', 'frog', 'duck', 'goose' ], { trailing: true }, true));

UnitTest.asynctest('Throttler.first', (success) => {
  const data: string[] = [];
  const throttler = Throttler.first((value: string) => {
    data.push(value);
  }, 250);

  throttler.throttle('cat');
  throttler.throttle('dog');
  throttler.throttle('elephant');
  throttler.throttle('frog');

  setTimeout(() => {
    Assert.eq('eq', [ 'cat' ], data);
    throttler.throttle('frog-goose');
    throttler.throttle('goose');
    setTimeout(() => {
      Assert.eq('eq', [ 'cat', 'frog-goose' ], data);
      success();
    }, 500);
  }, 500);
});

UnitTest.asynctest('Throttler.last', (success) => {
  const data: string[] = [];
  const throttler = Throttler.last((value: string) => {
    data.push(value);
  }, 250);

  throttler.throttle('cat');
  throttler.throttle('dog');
  throttler.throttle('elephant');
  throttler.throttle('frog');

  setTimeout(() => {
    Assert.eq('eq', [ 'frog' ], data);
    throttler.throttle('frog-goose');
    throttler.throttle('goose');
    setTimeout(() => {
      Assert.eq('eq', [ 'frog', 'goose' ], data);
      success();
    }, 500);
  }, 500);
});
