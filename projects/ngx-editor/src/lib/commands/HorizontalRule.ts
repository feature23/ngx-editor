import type { NodeType } from 'prosemirror-model';
import { type EditorState, type Transaction, type Command, TextSelection } from 'prosemirror-state';

import { canInsert } from 'ngx-editor/helpers';

import { InsertCommand } from './types';

class HorizontalRule implements InsertCommand {
  insert(): Command {
    return (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
      const { schema, tr } = state;

      const type: NodeType = schema.nodes['horizontal_rule'];

      if (!type) {
        return false;
      }

      const { $from } = state.selection;
      const parentNode = $from.parent;
      const parentStart = $from.before($from.depth);
      const parentEnd = $from.after($from.depth);

      const contentBefore = parentNode.cut(0, $from.parentOffset);
      const contentAfter = parentNode.cut($from.parentOffset);

      const nodes = [];

      if (contentBefore.content.size === 0 && contentAfter.content.size === 0) {
        // Empty paragraph: replace with HR + empty paragraph so cursor has
        // somewhere to land and the placeholder doesn't show on the <hr>.
        nodes.push(type.create());
        nodes.push(schema.nodes['paragraph'].createAndFill());
      } else {
        // Non-empty paragraph: preserve text on both sides of cursor.
        if (contentBefore.content.size > 0) {
          nodes.push(contentBefore);
        }
        nodes.push(type.create());
        if (contentAfter.content.size > 0) {
          nodes.push(contentAfter);
        } else {
          // Only add a trailing empty paragraph if this is the last block,
          // so the cursor has somewhere to land.
          const isLastChild = parentEnd >= state.doc.content.size;
          if (isLastChild) {
            nodes.push(schema.nodes['paragraph'].createAndFill());
          }
        }
      }

      tr.replaceWith(parentStart, parentEnd, nodes);
      tr.setSelection(TextSelection.near(tr.doc.resolve(tr.mapping.map(parentEnd))));

      dispatch(tr.scrollIntoView());
      return true;
    };
  }

  canExecute(state: EditorState): boolean {
    return canInsert(state, state.schema.nodes['horizontal_rule']);
  }
}

export default HorizontalRule;
