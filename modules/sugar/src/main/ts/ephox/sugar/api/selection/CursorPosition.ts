import { Optional } from '@ephox/katamari';
import { NodeAndChildNode, SugarElement } from '../node/SugarElement';
import * as PredicateFind from '../search/PredicateFind';
import * as Traverse from '../search/Traverse';
import * as Awareness from './Awareness';

const first = (element: SugarElement<Node>): Optional<SugarElement<ChildNode>> =>
  PredicateFind.descendant(element, Awareness.isCursorPosition);

const last = (element: SugarElement<Node>): Optional<SugarElement<ChildNode>> =>
  descendantRtl(element, Awareness.isCursorPosition);

// Note, sugar probably needs some RTL traversals.
const descendantRtl: {
  <T extends Node = Node>(scope: SugarElement<Node>, predicate: (e: SugarElement<Node>) => e is SugarElement<T>): Optional<SugarElement<T & ChildNode>>;
  (scope: SugarElement<Node>, predicate: (e: SugarElement<Node>) => boolean): Optional<SugarElement<NodeAndChildNode>>;
} = (scope: SugarElement<Node>, predicate: (e: SugarElement<Node>) => boolean): Optional<SugarElement<NodeAndChildNode>> => {
  const descend = (element: SugarElement<Node>): Optional<SugarElement<NodeAndChildNode>> => {
    const children = Traverse.children(element);
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (predicate(child)) {
        return Optional.some(child);
      }
      const res = descend(child);
      if (res.isSome()) {
        return res;
      }
    }

    return Optional.none<SugarElement<NodeAndChildNode>>();
  };

  return descend(scope);
};

export {
  first,
  last
};
