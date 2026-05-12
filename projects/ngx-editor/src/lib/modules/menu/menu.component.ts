import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { NgxEditorError } from 'ngx-editor/utils';
import Editor from '../../Editor';
import { NgxEditorService } from '../../editor.service';
import { Toolbar, ToolbarDropdown, ToolbarItem, ToolbarLink, ToolbarLinkOptions } from '../../types';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { DropdownComponent } from './dropdown/dropdown.component';
import { ImageComponent } from './image/image.component';
import { InsertCommandComponent } from './insert-command/insert-command.component';
import { LinkComponent } from './link/link.component';
import { MenuService } from './menu.service';
import { ToggleCommandComponent } from './toggle-command/toggle-command.component';

export const DEFAULT_TOOLBAR: Toolbar = [
  ['bold', 'italic'],
  ['code', 'blockquote'],
  ['underline', 'strike'],
  ['ordered_list', 'bullet_list'],
  [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
  ['link', 'image'],
  ['text_color', 'background_color'],
  ['align_left', 'align_center', 'align_right', 'align_justify'],
  ['format_clear'],
];

export const TOOLBAR_MINIMAL: Toolbar = [
  ['bold', 'italic'],
  [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
  ['link', 'image'],
  ['text_color', 'background_color'],
];

export const TOOLBAR_FULL: Toolbar = [
  ['bold', 'italic'],
  ['code', 'blockquote'],
  ['underline', 'strike'],
  ['ordered_list', 'bullet_list'],
  [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
  ['link', 'image'],
  ['text_color', 'background_color'],
  ['align_left', 'align_center', 'align_right', 'align_justify'],
  ['horizontal_rule', 'format_clear', 'indent', 'outdent'],
  ['superscript', 'subscript'],
  ['undo', 'redo'],
];

const DEFAULT_COLOR_PRESETS = [
  '#b60205',
  '#d93f0b',
  '#fbca04',
  '#0e8a16',
  '#006b75',
  '#1d76db',
  '#0052cc',
  '#5319e7',
  '#e99695',
  '#f9d0c4',
  '#fef2c0',
  '#c2e0c6',
  '#bfdadc',
  '#c5def5',
  '#bfd4f2',
  '#d4c5f9',
];

// Focusable trigger elements directly under each MenuBar entry
// (toggle/insert/link/image/color/dropdown trigger, plus any custom menu items).
// Excludes elements inside open popups/dropdowns, which are reached by tabbing once opened.
const FOCUSABLE_SELECTORS = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[tabindex]',
  '[contenteditable="true"]',
].join(',');
const TOOLBAR_ITEM_SELECTOR = [
  `:scope > ${FOCUSABLE_SELECTORS}`,
  `:scope > * > ${FOCUSABLE_SELECTORS}`,
  `:scope > * > * > ${FOCUSABLE_SELECTORS}`,
].join(',');

@Component({
  selector: 'ngx-editor-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  providers: [MenuService],
  imports: [
    CommonModule,
    ColorPickerComponent,
    DropdownComponent,
    ToggleCommandComponent,
    InsertCommandComponent,
    LinkComponent,
    ImageComponent,
  ],
})
export class NgxEditorMenuComponent implements OnInit, AfterViewInit, OnDestroy {
  private menuService = inject(MenuService);
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private ngxeService = inject(NgxEditorService);

  @Input() toolbar: Toolbar = TOOLBAR_MINIMAL;
  @Input() colorPresets: string[] = DEFAULT_COLOR_PRESETS;
  @Input() disabled = false;
  @Input() editor: Editor;
  @Input() customMenuRef: TemplateRef<unknown> | null = null;
  @Input() dropdownPlacement: 'top' | 'bottom' = 'bottom';

  toggleCommands: ToolbarItem[] = [
    'bold',
    'italic',
    'underline',
    'strike',
    'code',
    'blockquote',
    'ordered_list',
    'bullet_list',
    'align_left',
    'align_center',
    'align_right',
    'align_justify',
    'superscript',
    'subscript',
  ];

  insertCommands: ToolbarItem[] = [
    'horizontal_rule',
    'format_clear',
    'indent',
    'outdent',
    'undo',
    'redo',
  ];

  iconContainerClass = ['NgxEditor__MenuItem', 'NgxEditor__MenuItem--IconContainer'];
  dropdownContainerClass = ['NgxEditor__Dropdown'];
  seperatorClass = ['NgxEditor__Seperator'];

  private mutationObserver: MutationObserver | null = null;
  private editorKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private activeIndex = 0;

  get toolbarLabel(): Observable<string> {
    return this.ngxeService.locals.get('editorToolbar');
  }

  get presets(): string[][] {
    const col = 8;
    const colors: string[][] = [];

    this.colorPresets.forEach((color, index) => {
      const row = Math.floor(index / col);

      if (!colors[row]) {
        colors.push([]);
      }

      colors[row].push(color);
    });

    return colors;
  }

  isDropDown(item: ToolbarItem): boolean {
    if ((item as ToolbarDropdown)?.heading) {
      return true;
    }

    return false;
  }

  getDropdownItems(item: ToolbarItem): ToolbarDropdown {
    return item as ToolbarDropdown;
  }

  isLinkItem(item: ToolbarItem): boolean {
    if (item === 'link') {
      return true;
    }

    // NOTE: it is not sufficient to check for a `link` property
    // as String.prototype.link is a valid (although deprecated) method
    return typeof item === 'object' && typeof (item as ToolbarLink)?.link === 'object';
  }

  isLinkWithOptions(item: ToolbarItem): boolean {
    // NOTE: it is not sufficient to check for a `link` property
    // as String.prototype.link is a valid (although deprecated) method
    return typeof item === 'object' && typeof (item as ToolbarLink)?.link === 'object';
  }

  getLinkOptions(item: ToolbarItem): Partial<ToolbarLinkOptions> {
    return (item as ToolbarLink)?.link;
  }

  private getMenuBar(): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector('.NgxEditor__MenuBar');
  }

  private getToolbarItems(): HTMLElement[] {
    const menuBar = this.getMenuBar();
    if (!menuBar) {
      return [];
    }
    const all = Array.from(menuBar.querySelectorAll<HTMLElement>(TOOLBAR_ITEM_SELECTOR));
    // Exclude focusables nested inside an open popup, dropdown listbox, or dialog —
    // those are reached by tabbing once the popup is open, not via toolbar navigation.
    return all.filter((el) => !el.closest('.NgxEditor__Popup, [role="listbox"], [role="dialog"]'));
  }

  private isItemEnabled(el: HTMLElement): boolean {
    if ((el as HTMLButtonElement).disabled) {
      return false;
    }
    if (el.getAttribute('aria-disabled') === 'true') {
      return false;
    }
    if (el.classList.contains('NgxEditor--Disabled')) {
      return false;
    }
    return true;
  }

  private findEnabledIndex(items: HTMLElement[], start: number, step: 1 | -1): number {
    const len = items.length;
    for (let i = 0; i < len; i += 1) {
      const idx = ((start + step * i) % len + len) % len;
      if (this.isItemEnabled(items[idx])) {
        return idx;
      }
    }
    return -1;
  }

  private applyRovingTabindex(): void {
    const items = this.getToolbarItems();
    if (items.length === 0) {
      return;
    }

    // If the active index points at a disabled item (or out of range), pick the
    // nearest enabled item so Tab into the toolbar lands somewhere actionable.
    if (this.activeIndex >= items.length || !this.isItemEnabled(items[this.activeIndex])) {
      const fallback = this.findEnabledIndex(items, this.activeIndex >= items.length ? 0 : this.activeIndex, 1);
      this.activeIndex = fallback === -1 ? 0 : fallback;
    }

    items.forEach((item, i) => {
      item.tabIndex = i === this.activeIndex ? 0 : -1;
    });
  }

  private focusActiveItem(): boolean {
    const items = this.getToolbarItems();
    if (items.length === 0) {
      return false;
    }
    // Pick the active item if enabled, otherwise the first enabled item; if none, bail
    // so callers (e.g., editor's Shift+Tab handler) don't preventDefault and trap focus.
    let target = items[this.activeIndex];
    if (!target || !this.isItemEnabled(target)) {
      const idx = this.findEnabledIndex(items, 0, 1);
      if (idx === -1) {
        return false;
      }
      target = items[idx];
      this.activeIndex = idx;
      this.applyRovingTabindex();
    }
    target.focus();
    return document.activeElement === target;
  }

  @HostListener('focusin', ['$event']) onFocusIn(event: FocusEvent): void {
    const items = this.getToolbarItems();
    const index = items.indexOf(event.target as HTMLElement);
    if (index === -1) {
      return;
    }

    if (index !== this.activeIndex) {
      this.activeIndex = index;
      this.applyRovingTabindex();
    }
  }

  @HostListener('keydown', ['$event']) onKeydown(event: KeyboardEvent): void {
    const items = this.getToolbarItems();
    if (items.length === 0) {
      return;
    }

    const currentIndex = items.indexOf(event.target as HTMLElement);
    if (currentIndex === -1) {
      return;
    }

    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = this.findEnabledIndex(items, currentIndex + 1, 1);
        break;
      case 'ArrowLeft':
        nextIndex = this.findEnabledIndex(items, currentIndex - 1, -1);
        break;
      case 'Home':
        nextIndex = this.findEnabledIndex(items, 0, 1);
        break;
      case 'End':
        nextIndex = this.findEnabledIndex(items, items.length - 1, -1);
        break;
      default:
        return;
    }

    event.preventDefault();

    if (nextIndex === -1 || nextIndex === currentIndex) {
      return;
    }

    this.activeIndex = nextIndex;
    this.applyRovingTabindex();
    items[nextIndex].focus();
  }

  ngOnInit(): void {
    if (!this.editor) {
      throw new NgxEditorError('Required editor instance to initialize menu component');
    }

    this.menuService.editor = this.editor;
  }

  ngAfterViewInit(): void {
    this.applyRovingTabindex();

    // Re-apply when buttons appear/disappear (popups, dropdowns toggling) or when
    // a button's disabled state changes — so the active item is always one Tab can land on.
    this.mutationObserver = new MutationObserver(() => {
      this.applyRovingTabindex();
    });
    const menuBar = this.getMenuBar();
    if (menuBar) {
      this.mutationObserver.observe(menuBar, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'aria-disabled'],
      });
    }

    // Shift+Tab from the editor's contenteditable should land on the toolbar's active item.
    const editorDom = this.editor?.view?.dom;
    if (editorDom) {
      this.editorKeydownHandler = (e: KeyboardEvent): void => {
        if (e.key === 'Tab' && e.shiftKey && this.focusActiveItem()) {
          e.preventDefault();
        }
      };
      editorDom.addEventListener('keydown', this.editorKeydownHandler);
    }
  }

  ngOnDestroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (this.editorKeydownHandler && this.editor?.view?.dom) {
      this.editor.view.dom.removeEventListener('keydown', this.editorKeydownHandler);
      this.editorKeydownHandler = null;
    }
  }
}
