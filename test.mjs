import ChangeTracker from './index.js';

console.log('-> ChangeTracker:', ChangeTracker);

function test() {
  const testTracker = new ChangeTracker();

  /* Test removing listeners. */
  {
    let used = () => {}, unused = () => {};
    let shouldBeTrue, shouldBeFalse;

    // List removal and return values.
    const setterRemoverMap = new Map([
      [ 'getOnce', 'removeGetOnceListener' ],
      [ 'getEveryChange', 'removeGetEveryChangeListener' ],
      [ 'getNext', 'removeGetNextListener' ],
    ]);

    // Test all setters and removers.
    setterRemoverMap.forEach((remover, adder) => {
      // Example: testTracker.getNext(() => {});
      testTracker[adder](used);

      // Example: shouldBeTrue = testTracker.removeGetNextListener(() => {});
      shouldBeTrue = testTracker[remover](used);
      shouldBeFalse = testTracker[remover](unused);

      // Test equality.
      console.log(shouldBeTrue === true ? '[Pass]' : '[FAIL]', `${remover}: handle removal of registered listener.`);
      console.log(shouldBeFalse === false ? '[Pass]' : '[FAIL]', `${adder}: ignore removal of non-registered listener.`);
    });
  }

  /* Test listeners. */
  testTracker.getOnce((value) => {
    console.log('[1] getOnce - should get "1":', value);
    if (value !== 1) throw `[1] ChangeTracker: expected 1, got ${value}`;
  });

  testTracker.getNext((value) => {
    console.log('[2] getNext - should get "1":', value);
    if (value !== 1) throw `[2] ChangeTracker: expected 1, got ${value}`;
  });

  testTracker.getEveryChange((value) => {
    console.log('[3] getEveryChange - should get "1, 2, 3":', value);
    if (![ 1, 2, 3 ].includes(value)) throw `[3] ChangeTracker: expected [1|2|3], got ${value}`;
  });

  testTracker.setValue(1);
  setTimeout(() => {
    testTracker.setValue(2);

    testTracker.getOnce((value) => {
      console.log('[4] getOnce - should get "2":', value);
      if (value !== 2) throw `[4] ChangeTracker: expected 2, got ${value}`;
    });
  }, 0);

  setTimeout(() => {
    testTracker.setValue(2);
  }, 200);

  setTimeout(() => {
    testTracker.getNext((value) => {
      console.log('[5] getNext - should get "3":', value);
      if (value !== 3) throw `[5] ChangeTracker: expected 3, got ${value}`;
    });

    testTracker.setValue(3);
  }, 500);
}

test();
