<!-- FEATURE23-FORK: README rewritten for fork -->

# @feature23/ngx-editor

> **This is a fork of [ngx-editor](https://github.com/sibiraj-s/ngx-editor) maintained by [feature23](https://github.com/feature23).** It includes experimental changes and Angular version updates that have not yet been merged upstream. If you don't need these changes, please use the official package at [ngx-editor](https://github.com/sibiraj-s/ngx-editor).

<p align="center">
  <a href="https://github.com/feature23/ngx-editor">
   <img src="./sketch/ngx-editor.svg" alt="ngxEditor">
  </a>
</p>
<p align="center">The Rich Text Editor for Angular, Built on ProseMirror</p>

> A simple rich text editor for angular applications built with ProseMirror. It is a drop in and easy-to-use editor
> and can be easily extended using prosemirror plugins to build any additional or missing features

## Getting Started

[demo] | [edit on stackblitz][stackblitz] | [documentation] | [migrating from other editors][migration]

### Installation

Install via Package managers such as [npm] or [pnpm] or [yarn]

```bash
npm install @feature23/ngx-editor
# or
pnpm install @feature23/ngx-editor
# or
yarn add @feature23/ngx-editor
```

### Usage

**Note**: By default the editor comes with minimal features. Refer the [demo] and [documentation] for more details and examples.

Component

```ts
import {
  NgxEditorComponent,
  NgxEditorMenuComponent,
  Editor,
} from '@feature23/ngx-editor';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'editor-component',
  templateUrl: 'editor.component.html',
  styleUrls: ['editor.component.scss'],
  standalone: true,
  imports: [NgxEditorComponent, NgxEditorMenuComponent, FormsModule],
})
export class NgxEditorComponent implements OnInit, OnDestroy {
  html = '';
  editor: Editor;
  ngOnInit(): void {
    this.editor = new Editor();
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }
}
```

Then in HTML

```html
<div class="NgxEditor__Wrapper">
  <ngx-editor-menu [editor]="editor"> </ngx-editor-menu>
  <ngx-editor
    [editor]="editor"
    [ngModel]="html"
    [disabled]="false"
    [placeholder]="'Type here...'"
  ></ngx-editor>
</div>
```

Note: Input can be a HTML string or a jsonDoc

## Browser Compatibility

Mostly works on all Evergreen-Browsers like

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari
- Opera

## Collaborative Editing

See https://sibiraj-s.github.io/ngx-editor/#/collab

## Icons

Icons are from https://fonts.google.com/icons

## Contributing

All contributions are welcome. See [CONTRIBUTING.md](./.github/CONTRIBUTING.md) to get started.

[npm]: https://www.npmjs.com/
[pnpm]: https://pnpm.io/
[yarn]: https://yarnpkg.com/lang/en/
[documentation]: https://sibiraj-s.github.io/ngx-editor
[demo]: https://ngx-editor.stackblitz.io/
[stackblitz]: https://stackblitz.com/edit/ngx-editor
[migration]: https://sibiraj-s.github.io/ngx-editor/#/migration
