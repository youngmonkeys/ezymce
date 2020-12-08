import { Assert, UnitTest } from '@ephox/bedrock-client';
import * as Throttler from 'ephox/katamari/api/Throttler';

// const testThrottler = (throttle, expected: string[], options?) => (success: UnitTest.SuccessCallback) => {
//   const data: string[] = [];
//   const throttler = throttle((value: string) => {
//     data.push(value);
//   }, 250, options);
//   throttler.throttle('cat');
//   throttler.throttle('dog');
//   throttler.throttle('elephant');
//   throttler.throttle('frog');

//   setTimeout(() => {
//     Assert.eq('eq', [ 'frog' ], data);
//     throttler.throttle('frog-goose');
//     throttler.throttle('goose');
//     setTimeout(() => {
//       Assert.eq('eq', expected, data);
//       success();
//     }, 500);
//   }, 500);
// };

const testAdaptable = (expectedDataAfterFirst: string[], expectedDataAfterSecond: string[], options?) => (success: UnitTest.SuccessCallback) => {
  const data: string[] = [];
  const throttler = Throttler.adaptable((value: string) => {
    data.push(value);
  }, 50, options);

  throttler.throttle('cat');
  throttler.throttle('dog');
  throttler.throttle('elephant');
  throttler.throttle('frog');

  setTimeout(() => {
    Assert.eq('eq', expectedDataAfterFirst, data);
    throttler.throttle('frog-goose');
    throttler.throttle('duck');
    throttler.throttle('goose');
    setTimeout(() => {
      Assert.eq('eq', expectedDataAfterSecond, data);
      success();
    }, 100);
  }, 100);
};

// UnitTest.asynctest('Throttler.adaptable', (success) => {
//   const data: string[] = [];
//   const throttler = Throttler.adaptable((value: string) => {
//     data.push(value);
//   }, 250);

//   throttler.throttle('cat');
//   throttler.throttle('dog');
//   throttler.throttle('elephant');
//   throttler.throttle('frog');

//   setTimeout(() => {
//     Assert.eq('eq', [ 'frog' ], data);
//     throttler.throttle('frog-goose');
//     throttler.throttle('goose');
//     setTimeout(() => {
//       Assert.eq('eq', [ 'frog', 'goose' ], data);
//       success();
//     }, 500);
//   }, 500);
// });

UnitTest.asynctest('Throttler.adaptable', testAdaptable([ 'frog' ], [ 'frog', 'goose' ]));
UnitTest.asynctest('Throttler.adaptable with leading set to true', testAdaptable([ 'cat' ], [ 'cat', 'frog-goose' ], { leading: true }));
UnitTest.asynctest('Throttler.adaptable with trailing set to true', testAdaptable([ 'frog' ], [ 'frog', 'goose' ], { trailing: true }));
UnitTest.asynctest('Throttler.adaptable with leading and trailing set to true', testAdaptable([ 'cat', 'frog' ], [ 'cat', 'frog', 'frog-goose', 'goose' ], { leading: true, trailing: true }));

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
