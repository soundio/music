# music

A library of functions for analysing and transforming musical information.

<!--## Installation

  Install with [component(1)](http://component.io):

    $ component install stephband/midi-graph-->
    
    
### .consonance(array)

Takes an array of note numbers and returns a number from 0-1 that rates the
consonance of that group of notes.

    // Silence is golden
    music.consonance([])                    // 1
    
    // A single tone is consonant
    music.consonance([80])                  // 1
    
    // A major third is less consonant
    music.consonance([64, 68])              // 0.5
    
    // C7♭9 is really quite dissonant
    music.consonance([60, 61, 64, 67, 70])  // 0.129


### .density(array)

Takes an array of note numbers and rates the density of the group of notes
between 0 and 1. The more notes there are closer together, the higher the
density.

    music.density([45, 56])                 // 0.1666
    music.density([45, 50, 56])             // 0.25

### .range(array)

Takes an array of note numbers and returns the difference between the minimum
and maximum.

### .scale(array)

Returns an ascending array of numbers in the range <code>0-12</code> that
represents the scale formed from the notes in <code>array</code>.

### .transpose(array, n)

Takes an array of note numbers and transposes them by <code>n</code>.

### .chromaticism(array1, array2)

Returns a number in the range <code>0-1</code> representing the ratio of
note numbers in <code>array2</code> that are a chromatic half-step away from
note numbers in <code>array1</code>.

    // Two of these three notes are a chromatic half-step away
    music.chromaticism([61, 65, 68], [60, 64, 70])  // 0.666

### .parallelism(array1, array2)

Returns a number in the range <code>0-1</code> representing the ratio of note
numbers in <code>array2</code> that can be considered part of a group that has
moved chromatically as a block from note numbers in <code>array1</code>.

    // Two of these three notes move in parallel
    music.chromaticism([61, 65, 68], [59, 63, 70])  // 0.666

### .contraryParallelism(array1, array2)

Returns a number in the range <code>0-1</code> representing the ratio of note
numbers in <code>array2</code> that can be considered part of a group that has
moved chromatically as a block from note numbers in <code>array1</code>, where
there is more than one group and they move by different distances.

    // All four of these notes belong to a group that moves in parallel,
    // with each group moving contrary to the other
    music.chromaticism([61, 65, 68, 70], [59, 63, 70, 72])  // 1

Contrary parallelism requires chords of at least four notes. If either array
is less than length <code>4</code>, <code>contraryParallelism</code> returns 0.