# music

A library of functions for analysing and transforming musical information.

<!--## Installation

  Install with [component(1)](http://component.io):

    $ component install stephband/midi-graph-->
    
    
### .consonance(array)

Takes an array of note numbers and returns a number from 0-1 that rates the
consonance of that group of notes.

    music.consonance([64, 68])    // a major third

Silence is deemed to be perfectly consonant.

    music.consonance([])          // 1

Single notes are also perfectly consonant.

    music.consonance([80])        // 1

All other intervals return a value betweeen 0 and 1.

### .density(array)

Takes an array of note numbers and rates the density of the group of notes
between 0 and 1. The more notes there are closer together, the higher the
density.

    music.density([45, 56])       // -> 0.1666
    music.density([45, 50, 56])   // -> 0.25

### .range(array)

Takes an array of note numbers and returns the difference between the minimum
and maximum.

### .invert(array)

### .transpose(array, n)

Takes an array of note numbers and transposes them by <code>n</code>.

### .scale(array)

### .chromaticism(array1, array2)

### .parallelism(array1, array2)

### .contraryParallelism(array1, array2)