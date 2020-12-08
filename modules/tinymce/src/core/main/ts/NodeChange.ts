/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { Throttler } from '@ephox/katamari';
import DomQuery from './api/dom/DomQuery';
import Editor from './api/Editor';
import Env from './api/Env';
import { NodeChangeEvent } from './api/EventTypes';
import * as Settings from './api/Settings';
import Delay from './api/util/Delay';
import * as RangeCompare from './selection/RangeCompare';
import { hasAnyRanges } from './selection/SelectionUtils';

const internalNodeChanged = (editor: Editor) => (args?: Record<string, any>) => {
  const selection = editor.selection;
  let node: Node, parents: Node[], root: Node;

  // Fix for bug #1896577 it seems that this can not be fired while the editor is loading
  if (editor.initialized && selection && !Settings.shouldDisableNodeChange(editor) && !editor.mode.isReadOnly()) {
    // Get start node
    root = editor.getBody();
    node = selection.getStart(true) || root;

    // Make sure the node is within the editor root or is the editor root
    if (node.ownerDocument !== editor.getDoc() || !editor.dom.isChildOf(node, root)) {
      node = root;
    }

    // Get parents and add them to object
    parents = [];
    editor.dom.getParent(node, function (node) {
      if (node === root) {
        return true;
      }

      parents.push(node);
    });

    args = args || {};
    args.element = node;
    args.parents = parents;

    editor.fire('NodeChange', args as NodeChangeEvent);
  }
};

/**
 * This class handles the nodechange event dispatching both manual and through selection change events.
 *
 * @class tinymce.NodeChange
 * @private
 */

class NodeChange {
  private readonly editor: Editor;
  private lastPath: DomQuery | [] = [];
  private readonly nodeChangeThrottler: Throttler.Throttler<any[]>;

  public constructor(editor: Editor) {
    this.editor = editor;
    let lastRng;
    const self = this;
    this.nodeChangeThrottler = Throttler.adaptable(internalNodeChanged(editor), 15, { leading: true, trailing: true });

    // Gecko doesn't support the "selectionchange" event
    if (!('onselectionchange' in editor.getDoc())) {
      editor.on('NodeChange click mouseup keyup focus', function (e) {
        // Since DOM Ranges mutate on modification
        // of the DOM we need to clone it's contents
        const nativeRng = editor.selection.getRng();
        const fakeRng = {
          startContainer: nativeRng.startContainer,
          startOffset: nativeRng.startOffset,
          endContainer: nativeRng.endContainer,
          endOffset: nativeRng.endOffset
        };

        // Always treat nodechange as a selectionchange since applying
        // formatting to the current range wouldn't update the range but it's parent
        if (e.type === 'nodechange' || !RangeCompare.isEq(fakeRng, lastRng)) {
          editor.fire('SelectionChange');
        }

        lastRng = fakeRng;
      });
    }

    // IE has a bug where it fires a selectionchange on right click that has a range at the start of the body
    // When the contextmenu event fires the selection is located at the right location
    // TODO: Maybe this isn't needed if we already have the 'mouseup' trigger below
    editor.on('contextmenu', function () {
      editor.fire('SelectionChange');
    });

    // Selection change is delayed ~200ms on IE when you click inside the current range
    editor.on('SelectionChange', function () {
      const startElm = editor.selection.getStart(true);

      // When focusout from after cef element to other input element the startelm can be undefined.
      // IE 8 will fire a selectionchange event with an incorrect selection
      // when focusing out of table cells. Click inside cell -> toolbar = Invalid SelectionChange event
      if (!startElm || (!Env.range && editor.selection.isCollapsed())) {
        return;
      }

      if (hasAnyRanges(editor) && !self.isSameElementPath(startElm) && editor.dom.isChildOf(startElm, editor.getBody())) {
        editor.nodeChanged({ location: 'fromSelectionChange', selectionChange: true }, true);
      }
    });

    // Fire an extra nodeChange on mouseup for compatibility reasons
    editor.on('mouseup', function (e) {
      if (!e.isDefaultPrevented() && hasAnyRanges(editor)) {
        // Delay nodeChanged call for WebKit edge case issue where the range
        // isn't updated until after you click outside a selected image
        if (editor.selection.getNode().nodeName === 'IMG') {
          Delay.setEditorTimeout(editor, function () {
            editor.nodeChanged({ location: 'fromDelayedMouseup' }, true);
          });
        } else {
          editor.nodeChanged({ location: 'fromMouseup' }, true);
        }
      }
    });
  }

  /**
   * Dispatches out a onNodeChange event to all observers. This method should be called when you
   * need to update the UI states or element path etc.
   *
   * @method nodeChanged
   * @param {Object} args Optional args to pass to NodeChange event handlers.
   */

  public nodeChanged(args?: Record<string, any>, throttle: boolean = false) {
    // Old
    // internalNodeChanged(this.editor)(args);

    // If throttle is false by default this will have the least effect on the code and existing tests. Althoug, it won't actually do much to help reduce the number of nodeChanged calls
    // If throttle is true by default, this will reduce the overall number of nodeChanged calls but is more risky and affects quite a few existing tests ~18

    // Only throttle nodeChanged call if explicitly specified (this won't be as effective but doesn't affect existing tests)
    this.nodeChangeThrottler.throttle(args);
    if (throttle === false) {
      this.nodeChangeThrottler.flush();
    }
    // or
    // if (throttle === false) {
    //   internalNodeChanged(this.editor)(args);
    // } else {
    //   this.nodeChangeThrottler.throttle(args);
    // }
  }

  /**
   * Returns true/false if the current element path has been changed or not.
   *
   * @private
   * @return {Boolean} True if the element path is the same false if it's not.
   */
  private isSameElementPath(startElm) {
    let i: number;

    const currentPath = this.editor.$(startElm).parentsUntil(this.editor.getBody()).add(startElm);
    if (currentPath.length === this.lastPath.length) {
      for (i = currentPath.length; i >= 0; i--) {
        if (currentPath[i] !== this.lastPath[i]) {
          break;
        }
      }

      if (i === -1) {
        this.lastPath = currentPath;
        return true;
      }
    }

    this.lastPath = currentPath;

    return false;
  }
}

export {
  NodeChange
};
