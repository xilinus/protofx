ProtoFX
====

ProtoFX is a animation light weight framework based on [Prototype](http://prototypejs.org).

Question: One more?
Answer: YES! The only effect framework I know based on prototype is script.aculo.us. Current version is pretty old, slow and does
seemed to be maintain. Scripty 2 is supposed to be the next version but nothing happened for months now.
So I decided to create this framework for personal use. I needed to have something light, efficient with new features.

So ProtoFX is a simple animation framework, very light (base version is less than 7k packed).

The Semantic is inspired from music world. The object responsible of synchronized animations is called Metronome.
Effect methods are inspired from a music player: play/stop/rewind/reverse ...
Queue system is called 'Score' (it's reallu more powerful than standard queue system)

Main features are:
* Speed; animation are really fluid.
* Useful commands: start, stop, reverse, rewind. You can stop animation when you want and go back to start again. 
you can also reverse anamtio anin while playing.
* based on Penner equations.
* 'cloneable' effects. You can create an animation, without giving a target, and apply it to any DOM element for instance
* work with operators: example width: +=200px
* ...

There are two versions:
- base: without 'Score': 
  ex: new FX.Element("block1").animate({width: '200px});
  in many cases, you do not have complex animations to run
  
- full: includes a 'Score' class to compose any kind of effects like:
    new FX.Score().add(fx1).add(fx2, {after: fx1});

Check rake task to see how to build them but you can find them under dist directory

Unit test are coming :)

Documentation
=============

Documentation is done with [PDoc](http://pdoc.org).

Rake Tasks
==========

* rake build              # Build all dist files
* rake build:base         # Builds base dist fill (not compressed)
* rake build:full         # Builds full dist fill (not compressed)
* rake build:packed_base  # Builds base dist fill (compressed by yui compressor)
* rake build:packed_full  # Builds full dist fill (compressed by yui compressor)
* rake doc                # Generates documentation

ProtoFX is still under development and any contributions are welcome.
