## Change Tracker

An object-focused alternative to Publisher / Subscriber models.

## What's the purpose of this library?

To offer a simple means to track a single variable's initialization and
subsequent changes.

The variable you're tracking can be a primitive or an object. This library is
not opinionated about the data types you use.

## Example use-case

We are making a 3D video game and need to keep track of a spaceship. Game boot
is asynchronous and spaceship load time cannot be determined. Additionally,
some parts of our game need to be notified when the player switches to a
different spaceship. To complicate matters, our main game loop runs at
60 frames per second from early on and cannot use asynchronous callbacks.

Let's assume we have a spaceship class for loading our 3D spaceship. For the
sake of demonstration, we'll define our ship as:
```js
class PlayerShip {
  constructor() { console.log('New ship loaded.'); }
  get name() { return 'Friday' }
  render() { /* do gfx magic */ }
}
```

Let's write some code to track our game objects:
```js
// core.js

import ChangeTracker from 'change-tracker';

const gameObjects = {
  playerShipTracker: new ChangeTracker(),
};

export {
  gameObjects,
}
```

```js
// shipLoader.js

gameObjects.playerShipTracker.setValue(new PlayerShip());
// ^^ message is logged: 'New ship loaded.'
```

On first init, welcome the player:
```js
// boot.js

// This is called only after initialization. If the player ship has already
// been initialized, it'll call back immediately.
gameObjects.playerShipTracker.getOnce((shipInstance) => {
  alert('Welcome to The Space Game!');
  console.log('Player loaded', shipInstance.name);
})
```

Every time the ship is loaded (including init), update the UI:
```js
// ui.js

gameObjects.playerShipTracker.getEveryChange((shipInstance) => {
  const shipNameDiv = document.getElementById('ship-name');
  if (shipNameDiv) {
    shipNameDiv.innerHTML = shipInstance.name;
  }
});
```

From very early on, our GFX engine renders anything that can be rendered. It
should render the ship as soon as it's booted, but cannot use callbacks for
obvious timing reasons (it gets called 60 times per second). Instead of keeping
track of boot manually, you can get the latest known value of the ship. It will
be undefined until the spaceship has loaded.
Thereafter, we'll have a valid value.
```js
function renderGame() {
  requestAnimationFrame(renderGame);
  
  const ship = gameObjects.playerShipTracker.cachedValue;
  if (ship) {
    ship.render();
  }
}
```

#### Better IDE completion

If you want better IDE autocompletion, you can instead use
TypeScript in the initial definition. Here's an example of how you could
rewrite the definition in the first example code block:
```ts
interface TrackedPlayerShip extends ChangeTracker { cachedValue: PlayerShip; }

const playerShipTracker: TrackedPlayerShip = new ChangeTracker();

const gameObjects = { playerShipTracker };

// gameObjects.playerShipTracker.cachedValue.<< auto-completes properties >>
```

Note that your transpiler will already need to be set up to take advantage of
this. For reference, the config we used to build Change Tracker can be found
[here](https://github.com/frostoven/change-tracker/blob/master/webpack.config.js).

## Installation

This library supports all modern browsers, and Node.js (with your choice of
`import` or `require`).

You may install the library like so:
```bash
npm install change-tracker
```

Node.js:
```js
const ChangeTracker = require('change-tracker');
```

Browsers and modern Node.js:
```js
import ChangeTracker from 'change-tracker';
```

For browsers, it is recommended you use a bundler like Webpack. If you insist
on using the library in a browser without a bundler, you can
source it from a CDN such [UNPKG](https://unpkg.com/) which will store the main
class in window scope:
```html
<script src="https://unpkg.com/change-tracker@^1/browser.js"></script>
<script>
  const myVar = new ChangeTracker();
</script>
```

## Documentation

All functions are annotated with JSDoc comments so that you IDE can feed you
manuals on the fly (triggered by Ctrl+Q in IntelliJ, for example).

* Initialization:
```js
import ChangeTracker from 'change-tracker';
const trackedValue = new ChangeTracker();
```

* Set the value, and inform all subscribed listeners that the value has
changed:
```js
trackedValue.setValue({
  name: 'Joe',
  updated: Date.now(),
});
```

* You can request to be notified next time the variable changes, or is
initialized for the first time. If the value has already been initialized,
then `getOnce` will be triggered immediately:
```js
trackedValue.getOnce((trackedValue) => {
  console.log('Value has changed to:', trackedValue);
  console.log('This function will not be notified again.');
});
```

* You can undo a `getOnce` that has not yet been triggered, so long as you
keep a reference to the original function:
```js
function onValueChange(trackedValue) {
  console.log('Value has changed to:', trackedValue);
  console.log('This function will not be notified again.');
}

trackedValue.getOnce(onValueChange);
trackedValue.removeGetOnceListener(onValueChange);
```

* Subscribe to all changes indefinitely, then unsubscribe:
```js
function onValueChange(trackedValue) {
  console.log('Value has changed to:', trackedValue);
}

trackedValue.getEveryChange(onValueChange);

// [...]

trackedValue.removeGetEveryChangeListener(onValueChange);
```

* Get the next change only:
```js
function onValueChange(trackedValue) {
  console.log('Value has changed to:', trackedValue);
}

trackedValue.getNext(onValueChange);

// ...or undo that decision:
trackedValue.removeGetNextListener(onValueChange);
```

* Get notified until the coin lands tails:
```js
console.log('Flip until we get tails.');

function onValueChange(coinSide) {
  if (coinSide < 0.5) {
    console.log('-> tails.');
    // Subscription terminates.
  }
  else {
    console.log('-> heads.');
    trackedValue.getNext(onValueChange);
  }
}

trackedValue.getOnce(onValueChange);

// Flip coin forever:
setInterval(() => {
  trackedValue.setValue(Math.random())
}, 500);
```

## Dependencies

This package has no production dependencies, though it does use Babel
transpilation and Webpack for bundling. If you dislike this, you can import the
actual zero-dependency code as is using:
```
import ChangeTracker from 'change-tracker/src/index.ts';
```
Note however that this method requires a transpiler with TypeScript support
(you may look at our
[webpack config](https://github.com/frostoven/change-tracker/blob/master/webpack.config.js)
to see how we did it).

## Why is this repo not being updated?

If we've done our job correctly, there shouldn't be many updates. This library
is meant to simple yet powerful, and leaves design details up to you.

We'll update it to support modern tech changes as needed.
