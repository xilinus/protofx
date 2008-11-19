ProtoFX
====

ProtoFX is a animation light weight framework based on [Prototype](http://prototypejs.org).

Question: One more?
Answer: YES!

ProtoFX is a simple animation framework, very light (base version is less than 5k) but with some great features:
* speed, animation are pretty fluid.
* with usefull behaviors: start, stop, reverse, rewind. I can stop animation when you wants and go back to start.
* based on Penner equation.
* 'cloneable'. You can create an animation, without giving a target, and apply it to any DOM element for instance
* work with operator like width: +=200px

There are two versions:
- base: has only simple effect on DOM element like: new FX.Element("block1").animate({width: '200px});
- full: includes a 'Score' class to compose any kind of effects like:
    new FX.Score().add(fx1).add(fx2, {after: fx1});

Documentation
=============
Documentation is done with [PDoc](http://pdoc.org).

Rake Tasks
==========

ProtoFX is still under development and any contributions are welcome.