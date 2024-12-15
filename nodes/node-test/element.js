
import Menu        from 'forms/file-menu/module.js';
import NormalInput from 'forms/normal-input/element.js';
import RotaryInput from 'forms/rotary-input/element.js';

import Data     from 'fn/data.js';
import get      from 'fn/get.js';
import overload from 'fn/overload.js';
import Signal   from 'fn/signal.js';
import events   from 'dom/events.js';
import element  from 'dom/element.js';
import { createProperty } from 'dom/element/create-attribute.js';
import { dragstart, dragend }        from '../../../bolt/attributes/data-draggable.js';
import { dragenter, dragover, drop } from '../../../bolt/attributes/data-droppable.js';
import { nodes }        from '../../modules/graph-node.js';


const assign = Object.assign;
window.Data = Data;

/* Element */

export default element('', {

}, {

});
